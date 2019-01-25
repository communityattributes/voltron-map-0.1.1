module Voltron
  module Map
    class UrlBuilder
      class Visible

        def initialize(address)
          @address = Array.wrap(address).map(&:to_s).map(&:strip).join(',')
        end

        def to_s
          @address
        end

      end
    end
  end
end