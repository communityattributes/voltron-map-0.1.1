module Voltron
  module Map
    class UrlBuilder
      class Style

        def initialize(feature, element, rules={})
          @feature = feature.to_s
          @element = element.to_s
          @rules = rules.stringify_keys
        end

        def to_s
          { feature: @feature, element: @element }.merge(@rules).map { |k,v| "#{k.downcase}:#{v}" }.join('|')
        end

      end
    end
  end
end