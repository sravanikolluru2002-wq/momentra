insert into public.momentra_venues (slug, title, city, area, venue_type, status, capacity_min, capacity_max, price_label, description, image_url, amenities, sort_order)
values
  ('momentra-home-service-vizag', 'Momentra Home Service', 'Vizag', 'Customer home', 'customer home', 'demo', 2, 40, 'Custom quote', 'Momentra coordinates decor, food, music, hosting, and cleanup at the customer home.', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80', '["Home setup","Food coordination","Decor support","Music add-ons"]'::jsonb, 1),
  ('partner-lounge-vizag', 'Partner Lounge Vizag', 'Vizag', 'Central Vizag', 'partner venue', 'demo', 12, 80, 'Starting ₹11,999', 'A partner lounge suitable for cocktail parties, bachelorette nights, and private celebrations.', 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=900&q=80', '["Lounge seating","Music ready","Food service","Decor friendly"]'::jsonb, 2),
  ('vizag-outskirts-day-plan', 'Vizag Outskirts Day Plan', 'Vizag', 'Outskirts', 'outdoor destination', 'demo', 8, 45, 'Starting ₹8,999', 'A destination-ready picnic and day outing format with guide, food, games, and transport add-ons.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80', '["Guide","Outdoor activities","Food options","Bonfire add-on"]'::jsonb, 3)
on conflict (slug) do update
set title = excluded.title,
city = excluded.city,
area = excluded.area,
venue_type = excluded.venue_type,
status = excluded.status,
capacity_min = excluded.capacity_min,
capacity_max = excluded.capacity_max,
price_label = excluded.price_label,
description = excluded.description,
image_url = excluded.image_url,
amenities = excluded.amenities,
sort_order = excluded.sort_order;

insert into public.momentra_addons (slug, title, addon_type, status, price, price_label, description, icon_label, sort_order)
values
  ('host-games-coordinator', 'Host or Games Coordinator', 'host', 'demo', 2200, '+₹2,200', 'A friendly host to coordinate games, announcements, and guest flow.', 'HOST', 1),
  ('food-service-package', 'Food', 'food', 'demo', 3500, '+₹3,500', 'Food coordination with curated starters, buffet, snacks, beverages, or custom menu options.', 'FOOD', 2),
  ('dj-music-setup', 'DJ or Music Setup', 'music', 'demo', 3000, '+₹3,000', 'Music system or DJ support depending on package and venue permissions.', 'MUSIC', 3),
  ('cleanup-support', 'Cleanup Support', 'service', 'demo', 1200, '+₹1,200', 'Post-event cleanup support for home and private venue experiences.', 'CLEAN', 4),
  ('photographer-basic', 'Photographer', 'photo', 'demo', 4500, '+₹4,500', 'Photo coverage for candids, portraits, decor, and group moments.', 'PHOTO', 5),
  ('projector-screen', 'Projector / Screen', 'av', 'demo', 2500, '+₹2,500', 'Projector or screen support for memories, presentations, or games.', 'AV', 6)
on conflict (slug) do update
set title = excluded.title,
addon_type = excluded.addon_type,
status = excluded.status,
price = excluded.price,
price_label = excluded.price_label,
description = excluded.description,
icon_label = excluded.icon_label,
sort_order = excluded.sort_order;

insert into public.momentra_food_menu_items (slug, title, food_type, category, status, price_label, description, dietary_tags, sort_order)
values
  ('veg-paneer-tikka', 'Paneer Tikka', 'veg', 'veg starters', 'demo', 'Included in custom menu', 'Classic grilled paneer starter for house parties and cocktail menus.', '["veg","starter"]'::jsonb, 1),
  ('veg-crispy-corn', 'Crispy Corn', 'veg', 'veg starters', 'demo', 'Included in custom menu', 'Crispy corn snack for games nights and casual gatherings.', '["veg","snack"]'::jsonb, 2),
  ('nonveg-chicken-tikka', 'Chicken Tikka', 'non-veg', 'non-veg starters', 'demo', 'Included in custom menu', 'Popular chicken starter for private dinners and cocktail parties.', '["non-veg","starter"]'::jsonb, 3),
  ('nonveg-fish-fry', 'Fish Fry', 'non-veg', 'non-veg starters', 'demo', 'Included in custom menu', 'Coastal-style fish starter for Vizag menus.', '["non-veg","seafood"]'::jsonb, 4),
  ('buffet-veg-biryani', 'Veg Biryani', 'veg', 'buffet meal', 'demo', 'Included in buffet', 'Main-course buffet item for social celebrations.', '["veg","main"]'::jsonb, 5),
  ('buffet-chicken-biryani', 'Chicken Biryani', 'non-veg', 'buffet meal', 'demo', 'Included in buffet', 'Main-course buffet item for premium party menus.', '["non-veg","main"]'::jsonb, 6),
  ('dessert-gulab-jamun', 'Gulab Jamun', 'veg', 'desserts', 'demo', 'Included in desserts', 'Warm dessert option for birthdays, kitty, and house parties.', '["veg","dessert"]'::jsonb, 7),
  ('beverage-mocktails', 'Mocktails', 'veg', 'beverages', 'demo', 'Included in beverage setup', 'Curated mocktail options for date nights, birthdays, and cocktail party alternatives.', '["veg","beverage"]'::jsonb, 8)
on conflict (slug) do update
set title = excluded.title,
food_type = excluded.food_type,
category = excluded.category,
status = excluded.status,
price_label = excluded.price_label,
description = excluded.description,
dietary_tags = excluded.dietary_tags,
sort_order = excluded.sort_order;

insert into public.momentra_packages (slug, occasion_id, venue_id, title, city, status, package_type, price, price_label, minimum_guests, capacity, duration, short_description, description, image_url, inclusions, requirements, metadata, sort_order)
select
  seed.slug,
  seed.occasion_id,
  venue.id,
  seed.title,
  seed.city,
  'demo',
  seed.package_type,
  seed.price,
  seed.price_label,
  seed.minimum_guests,
  seed.capacity,
  seed.duration,
  seed.short_description,
  seed.description,
  seed.image_url,
  seed.inclusions::jsonb,
  seed.requirements::jsonb,
  seed.metadata::jsonb,
  seed.sort_order
from (
  values
    ('private-dinner-at-home', 'house-party', 'momentra-home-service-vizag', 'Private Dinner at Home', 'Vizag', 'home-service', 6999, 'Starting ₹6,999', 8, 18, '3 hours', 'Styled private dinner at home with food coordination and warm table styling.', 'Momentra coordinates table styling, food flow, lighting, and optional host support for a polished private dinner at home.', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80', '["Table styling","Food coordination","Warm lighting","Momentra planning support"]', '["Food / customized menu","Games","Bartender","Custom theme","Dance floor or open space","DJ optional","Projector optional","Host optional","Photographer optional","Cleanup optional"]', '{"rating":4.7,"badge":"new","venue":"At your home • Vizag"}', 1),
    ('birthday-at-home', 'birthday', 'momentra-home-service-vizag', 'Birthday at Home Setup', 'Vizag', 'home-service', 4999, 'Starting ₹4,999', 8, 25, '3 hours', 'Home birthday setup with decor, food support, music add-ons, and cleanup options.', 'A polished at-home birthday package where Momentra coordinates decor, cake table styling, food support, music, and optional photographer.', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80', '["Decor setup","Cake table styling","Food support","Music add-ons"]', '["Food","Decor","Music","Projector/screen optional","Cake complimentary or add-on","Host optional","Photographer optional","Custom theme optional"]', '{"rating":4.8,"badge":"new","venue":"At your home • Vizag"}', 2),
    ('signature-cocktail-party', 'cocktail-party', 'partner-lounge-vizag', 'Signature Cocktail Party', 'Vizag', 'partner-package', 11999, 'Starting ₹11,999', 18, 60, '4 hours', 'Decor, buffet, bar setup, music, dance floor, and party flow support.', 'A lounge-style cocktail party package where Momentra coordinates decor, food, bar setup, music, dance floor planning, and optional host/live band support.', 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=900&q=80', '["Partner venue coordination","Decor planning","Food flow support","Music-ready setup"]', '["Decor package","Food / curated buffet","Bar / drinks setup","Dance floor","DJ / music","Live band optional","Photographer optional","Host optional"]', '{"rating":4.8,"badge":"new","venue":"Partner Lounge, Vizag"}', 3),
    ('hosted-board-games-night', 'board-games', 'momentra-home-service-vizag', 'Hosted Board Games Night', 'Vizag', 'home-service', 3999, 'Starting ₹3,999', 8, 20, '3 hours', 'Board games kit, snacks, beverages, music, and optional game coordinator.', 'A relaxed games night with board games kit, snacks, beverages, music, and optional coordinator or food package.', 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=900&q=80', '["Board games kit","Snacks","Beverages","Music support"]', '["Venue or home setup","Board games kit","Snacks","Beverages","Music","Host/game coordinator optional","Food optional"]', '{"rating":4.7,"badge":"","venue":"At your home or cafe venue, Vizag"}', 4),
    ('guided-day-picnic', 'picnic', 'vizag-outskirts-day-plan', 'Guided Picnic & Day Outing', 'Vizag', 'destination', 8999, 'Starting ₹8,999', 12, 45, 'Full day', 'Destination, guide, food, activities, board games, bonfire, and transport options.', 'A destination-style outing where Momentra coordinates venue, guide, food, activities, board games, bonfire options, and transport support.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80', '["Destination planning","Guide coordination","Food options","Activities and games"]', '["Venue/destination","Guide provided","Day outing or overnight stay","Fun activities","Board games","Bonfire","Food","Transportation optional"]', '{"rating":4.8,"badge":"trending","venue":"Vizag outskirts, Araku, or resort destination"}', 5)
) as seed(slug, occasion_id, venue_slug, title, city, package_type, price, price_label, minimum_guests, capacity, duration, short_description, description, image_url, inclusions, requirements, metadata, sort_order)
left join public.momentra_venues venue on venue.slug = seed.venue_slug
on conflict (slug) do update
set occasion_id = excluded.occasion_id,
venue_id = excluded.venue_id,
title = excluded.title,
city = excluded.city,
status = excluded.status,
package_type = excluded.package_type,
price = excluded.price,
price_label = excluded.price_label,
minimum_guests = excluded.minimum_guests,
capacity = excluded.capacity,
duration = excluded.duration,
short_description = excluded.short_description,
description = excluded.description,
image_url = excluded.image_url,
inclusions = excluded.inclusions,
requirements = excluded.requirements,
metadata = excluded.metadata,
sort_order = excluded.sort_order;

insert into public.momentra_package_addons (package_id, addon_id, included, sort_order)
select package.id, addon.id, false, addon.sort_order
from public.momentra_packages package
cross join public.momentra_addons addon
where package.slug in ('private-dinner-at-home', 'birthday-at-home', 'signature-cocktail-party', 'hosted-board-games-night', 'guided-day-picnic')
on conflict (package_id, addon_id) do update
set included = excluded.included,
sort_order = excluded.sort_order;

insert into public.momentra_package_food_items (package_id, food_item_id, included, sort_order)
select package.id, food.id, false, food.sort_order
from public.momentra_packages package
cross join public.momentra_food_menu_items food
where package.slug in ('private-dinner-at-home', 'birthday-at-home', 'signature-cocktail-party', 'hosted-board-games-night', 'guided-day-picnic')
on conflict (package_id, food_item_id) do update
set included = excluded.included,
sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
