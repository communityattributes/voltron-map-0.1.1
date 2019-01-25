module Voltron
  module Map
    module Generators
      class InstallGenerator < Rails::Generators::Base

        source_root File.expand_path("../../../templates", __FILE__)

        desc "Add Voltron Map initializer"

        def inject_initializer

          voltron_initialzer_path = Rails.root.join("config", "initializers", "voltron.rb")

          unless File.exist? voltron_initialzer_path
            unless system("cd #{Rails.root.to_s} && rails generate voltron:install")
              puts "Voltron initializer does not exist. Please ensure you have the 'voltron' gem installed and run `rails g voltron:install` to create it"
              return false
            end
          end

          current_initiailzer = File.read voltron_initialzer_path

          unless current_initiailzer.match(Regexp.new(/# === Voltron Map Configuration ===/))
            inject_into_file(voltron_initialzer_path, after: "Voltron.setup do |config|\n") do
<<-CONTENT

  # === Voltron Map Configuration ===

  # Google Static Maps API key, required for any reasonable amount of requests or to track usage
  # Get a key at https://console.developers.google.com, after enabling the Google Static Maps API
  config.map.key = ''

  # Whether or not to treat warnings as failures (errors)
  # In the event of a map warning that would not be considered an outright failure
  # i.e. - Map center was okay, but defined path was not, this will force an error,
  # causing the defined `error` css class to be appended, and the map to fallback to
  # the defined fallback params below, or the fallback image if rendering a map is deemed not possible.
  # Keep in mind that if a full blown error is encountered failures happen anyways. Such as an invalid api key.
  # config.map.fail_on_warning = false

  # Whether or not to include the Google maps API response message as a data-map-response attribute
  # on calls to +map_tag+. This attribute will only be appended if there is a message to show
  # config.map.include_response = true

  # The ultimate fallback. Only needed if the maps api either cannot be reached or api key is invalid
  # The image defined here will appear in place of the map. It can be either an image name, remote url,
  # or base64 encoded image valid for use in an <img /> tags `src` attribute. Default is invisible 1px gif
  config.map.fallback_image = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

  # Default map parameters, so they do not need to be defined on each call to +map_tag+ or +map_url+
  # config.map.defaults = {}

  # Fallback parameters in the event of a map api error (location not found, for example)
  # Any parameter defined here should also be an acceptable param for the second argument of +map_tag+
  config.map.fallback = {}

  # Depending on the result of the map lookup, will include the appropriate defined css classes
  # Can be defined as a single class name or array of class names. Only applies to calls to +map_tag+
  # Will combine class names defined here with any class names defined as the image tag options (3rd arg of +map_tag+)
  # config.map.classes = {
  #   error: 'map-error',
  #   success: 'map-success',
  #   warning: 'map-warning',
  #   invalid: 'map-invalid'
  # }
CONTENT
            end
          end
        end

      end
    end
  end
end