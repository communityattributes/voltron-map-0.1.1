module Voltron
  module Map
    class UrlBuilder
      class Marker

        def initialize(address, options={})
          @address = Array.wrap(address).map(&:to_s).map(&:strip).join(',')
          @options = options.stringify_keys
        end

        def to_s
          (@options.map { |k,v| "#{k.downcase}:#{v}" } << @address).join('|')
        end

      end
    end
  end
end