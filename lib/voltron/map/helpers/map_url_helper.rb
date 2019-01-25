module Voltron
  module Map
    module MapUrlHelper

      def map_url(address, options={}, &block)
        image = Voltron::Map::Image.new(address, options, &block)
        image.url
      end

    end
  end
end
