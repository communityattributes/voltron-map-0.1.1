require 'net/http'

module Voltron
  module Map

    class Image

      class MapParamError < ::StandardError; end

      class RequestInvalidError < ::StandardError; end

      attr_accessor :url, :message, :state, :options

      def initialize(address, options={}, &block)
        @options = options.symbolize_keys
        builder = UrlBuilder.new(address, options)
        builder.instance_exec(&block) if block_given?
        @url, @message, @state = load(builder)
      end

      def load(builder)
        Rails.cache.fetch "voltron_map_#{builder.id}" do
          begin
            uri = URI(builder.url)
            # Go try and fetch the map
            request = Net::HTTP::Get.new(uri)
            response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') { |http| http.request(request) }

            # Raise with the error message from google, if any
            raise MapParamError.new(response.body) if response.code.to_i == 400
            raise RequestInvalidError.new(response.body) if response.code.to_i == 403

            # If there is a warning, check to see if we should fail on warnings, otherwise log the error and continue
            if response['X-Staticmap-API-Warning'].present?
              raise MapParamError.new(response['X-Staticmap-API-Warning']) if Voltron.config.map.fail_on_warning
              # If we don't fail on warnings, continue, but with the warning message logged
              Voltron.log response['X-Staticmap-API-Warning'], 'Map', :light_yellow
              # Return the url, but with the warning message and state
              [builder.url, response['X-Staticmap-API-Warning'], :warning]
            else
              # Everything went a-okay, all good here
              [builder.url, nil, :success]
            end
          rescue MapParamError => e
            # A parameter for the static map was not acceptable
            Voltron.log e.message, 'Map', :light_red
            fallback_builder = UrlBuilder.new('', options.merge(Voltron.config.map.fallback))
            [fallback_builder.url, e.message, :error]
          rescue RequestInvalidError => e
            # The API key is invalid, maps won't work no matter what we do
            Voltron.log e.message, 'Map', :light_red
            [fallback_image, e.message, :invalid]
          rescue => e
            # Everything else, i.e. - no internet, server down
            # TODO: Consider just rescuing everything, instead of having a separate rescue for RequestInvalidError
            # currently separate for the sake of readability/reason/whatever
            Voltron.log e.message, 'Map', :light_red
            [fallback_image, e.message, :invalid]
          end
        end
      end

      def fallback_image
        if Voltron.config.map.fallback_image.to_s.start_with?('http') || Voltron.config.map.fallback_image.to_s.start_with?('data:')
          # If image fallback is a remote url or base64 encoded data, just return that
          Voltron.config.map.fallback_image.to_s
        else
          # Assume the image fallback is an asset, try to find the path
          Voltron.asset.file_path(Voltron.config.map.fallback_image)
        end
      end

      # Whether or not we have a message from the map request
      def has_message?
        !message.blank?
      end

      # Get the appropriate class name, depending on the state of our map request
      def class_name
        Array.wrap(Voltron.config.map.classes.stringify_keys[state.to_s]).flatten.compact.join(' ')
      end

    end
  end
end