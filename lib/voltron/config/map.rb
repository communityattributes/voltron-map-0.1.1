require 'active_support'

module Voltron
  class Config

    include ::ActiveSupport::Callbacks

    set_callback :generate_voltron_config, :add_map_config

    def map
      @map ||= Map.new
    end

    def add_map_config
      Voltron.config.merge(map: map.to_h)
    end

    class Map

      attr_accessor :defaults, :fallback, :key, :fail_on_warning, :fallback_image, :classes, :include_response

      def initialize
        @defaults ||= {}
        @fallback ||= {}
        @key ||= ''
        @fallback_image ||= 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
        @classes ||= {
          error: 'map-error',
          success: 'map-success',
          warning: 'map-warning',
          invalid: 'map-invalid'
        }
        @include_response = true if @include_response.nil?
      end

      def to_h
        { key: key }
      end

    end
  end
end