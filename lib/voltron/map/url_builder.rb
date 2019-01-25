require 'digest/md5'

module Voltron
  module Map
    class UrlBuilder

      include ::ActionView::Helpers::AssetTagHelper

      BASE_URL = 'https://maps.googleapis.com/maps/api/staticmap?'

      def initialize(address, options={})
        @address = address
        @options = options.stringify_keys
      end

      def marker(address=nil, **options)
        # If nil, it means we want to just mark the address "center" that was defined in +initialize+
        if address.nil?
          markers << Marker.new(@address, options)
        else
          markers << Marker.new(address, options)
        end
      end

      def visible(*addresses)
        addresses.each do |address|
          visibles << Visible.new(address)
        end
      end

      def path(*points, **options)
        paths << Path.new(points, options)
      end

      def style(feature=:all, element=:all, **rules)
        styles << Style.new(feature, element, rules)
      end

      def id
        Digest::MD5.hexdigest params.flatten.join('|') + Voltron.config.map.fail_on_warning.to_s
      end

      def params
        param = (Voltron.config.map.defaults || {}).stringify_keys.merge(@options)

        # Ensure the center param is a comma separated list of coordinates
        # Also, the center (and zoom) must always be defined unless
        # markers, paths, or visible locations are defined, in which case
        # google will auto zoom/center to show the locations
        param['center'] = Array.wrap(param['center'] || (has_locations? && @address.blank? ? nil : @address)).map(&:to_s).map(&:strip).join(',')

        param['zoom'] = param['zoom'] || (has_locations? ? nil : 15)

        # Ensure the size parameter is defined in a format fitting WidthxHeight
        param['size'] = extract_dimensions(param['size'] || '500x500').join('x')

        param['key'] ||= Voltron.config.map.key

        param['visible'] = visibles.map(&:to_s).join('|')

        param.reject! { |k,v| v.blank? }

        # Compare by key identity so we can add multiple `markers` keys
        param.compare_by_identity

        markers.each { |m| param['markers'.dup] = m.to_s }
        paths.each { |p| param['path'.dup] = p.to_s }
        styles.each { |s| param['style'.dup] = s.to_s }
        param
      end

      def url
        BASE_URL + params.to_query
      end

      private

        def has_locations?
          !(markers.empty? && visibles.empty? && paths.empty?)
        end

        def markers
          @markers ||= []
        end

        def visibles
          @visibles ||= []
        end

        def paths
          @paths ||= []
        end

        def styles
          @styles ||= []
        end

    end
  end
end