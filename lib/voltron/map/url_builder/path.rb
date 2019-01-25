module Voltron
  module Map
    class UrlBuilder
      class Path

        def initialize(points, **options)
          @points = Array.wrap(points).map do |point|
            if point.is_a?(Array)
              point.map(&:to_s).join(',')
            else
              point.to_s
            end
          end
          @options = options.stringify_keys
        end

        def to_s
          output = @options.map { |k,v| "#{k.downcase}:#{v}" }
          output += @points
          output.join('|')
        end

      end
    end
  end
end