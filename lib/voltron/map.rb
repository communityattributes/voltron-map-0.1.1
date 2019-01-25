require 'voltron'
require 'voltron/map/version'
require 'voltron/config/map'
require 'voltron/map/image'
require 'voltron/map/url_builder'

# Feature Params
require 'voltron/map/url_builder/marker'
require 'voltron/map/url_builder/visible'
require 'voltron/map/url_builder/path'
require 'voltron/map/url_builder/style'

# Helpers
require 'voltron/map/helpers/map_url_helper'
require 'voltron/map/helpers/map_tag_helper'

module Voltron
  module Map
    # Nothing here yet. Maybe someday
  end
end

require "voltron/map/engine" if defined?(Rails)
