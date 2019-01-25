module Voltron
  module Map
    module MapTagHelper

      include ::ActionView::Helpers::AssetTagHelper

      include ::Voltron::Map::MapUrlHelper

      def map_tag(address, options={}, image_options={}, &block)
        options.symbolize_keys!
        image_options.symbolize_keys!
        image_options[:alt] ||= address

        image = Voltron::Map::Image.new(address, options, &block)

        map_options = {}
        map_options[:class] = image.class_name
        map_options[:data] = { map_response: image.message } if image.has_message? && Voltron.config.map.include_response

        image_options.deep_merge!(map_options) { |k, v1, v2| [v1, v2].join(' ').strip }

        image_tag image.url, image_options
      end

    end
  end
end
