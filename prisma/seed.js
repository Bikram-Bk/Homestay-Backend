import { PrismaClient, Role, RoomType, MealOption } from "@prisma/client";
import { hashPassword } from "../utils/password.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Clean existing records in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.homestay.deleteMany();
  await prisma.villageGuide.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Existing database records cleared.");

  // 2. Seed Users
  const adminPassword = await hashPassword("AdminPassword123!");
  const travelerPassword = await hashPassword("Traveler123!");

  const admin = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@homestaynepal.com",
      password: adminPassword,
      phone: "+977-9801234567",
      role: Role.ADMIN,
    },
  });

  const traveler = await prisma.user.create({
    data: {
      name: "Bikram Traveler",
      email: "traveler@gmail.com",
      password: travelerPassword,
      phone: "+977-9841234567",
      role: Role.TRAVELER,
    },
  });

  console.log(`👤 Users seeded: Admin (${admin.email}), Traveler (${traveler.email})`);

  // 3. Seed Village Guides 
  const villageGuidesData = [
    {
      village: "Ghandruk",
      region: "Kaski, Annapurna",
      content: `Ghandruk is one of Nepal's most picturesque and popular Gurung villages, situated at an altitude of 2,012 meters in the Annapurna Conservation Area. Famous for its stone-paved alleys, slate-roofed traditional stone cottages, and uninterrupted vistas of Annapurna South, Hiunchuli, and Machapuchare (Fishtail).

Local Culture & Traditions:
The village is predominantly inhabited by the Gurung community, known for their bravery as Gurkha soldiers and their hospitable nature. Visitors can visit the Old Gurung Museum (Gurung Sangrahalaya) to experience traditional attire, ancestral hunting gear, and antique brass household items.

Authentic Food & Hospitality:
Traditional meals consist of local organic dal bhat, gundruk-bhatmas sandeko, kodo ko roti (finger millet flatbread), wild honey, and locally brewed chhyang (rice wine). Guests are received with traditional marigold garlands and tika.

Getting There & Trekking:
Accessible via a 2.5-hour drive from Pokhara to Nayapul / Kimche, followed by a scenic 1-hour walk or direct jeep ride. Best season to visit is September to December for crystal-clear mountain views and March to May for blooming rhododendrons.`,
      tags: ["Annapurna", "Gurung Culture", "Himalayan View", "Trekking", "Organic Farm"],
    },
    {
      village: "Bandipur",
      region: "Tanahun",
      content: `Bandipur is a remarkably preserved living museum of Newari architecture perched on a high ridge (1,030m) above Dumre. Established as a trading point between Tibet and India in the 18th century, Bandipur banned motor vehicles from its central bazaar, keeping its cobblestone street serene and timeless.

Key Attractions:
- Tin Dhara (Three Natural Springs)
- Thani Mai Temple atop Gurungche Hill for 360-degree sunrise views of Manaslu, Dhaulagiri, and Langtang
- Siddha Cave (Siddha Gufa), one of the largest caves in South Asia (437 meters deep)
- Tudikhel viewpoint and silkworm farm

Hospitality & Culinary Specialties:
Experience authentic Newari homestays with red-brick facades, ornate carved wooden windows, and open courtyards. Enjoy traditional Yomari, Choila, Bara, Samay Baji, and Aila.`,
      tags: ["Newari Architecture", "Heritage", "Siddha Cave", "Car-Free Bazaar", "Sunrise View"],
    },
    {
      village: "Sirubari",
      region: "Syangja",
      content: `Sirubari is celebrated as Nepal's first official model village homestay, situated southwest of Pokhara at 1,700m. It won the prestigious PATA Gold Award for eco-tourism and sustainable village development.

Village Architecture & Cleanliness:
The village is exceptionally neat, paved throughout with stone stairways, bordered by blooming flower gardens, and free of litter. Houses are built from local stone with tidy slate roofs.

Community Welcoming Ceremony:
Sirubari follows a rotating homestay system managed by the village tourism committee. Guests are formally welcomed at the village entrance with panche baja (traditional five instruments), vermillion tika, and flower garlands.

Local Experience:
Stay with warm Gurung host families, participate in daily farming activities, milk local cows, and hike up to Thumro viewpoint (2,300m) for sunrise over the Annapurna and Dhaulagiri mountain ranges.`,
      tags: ["Model Homestay", "PATA Award", "Gurung Hospitality", "Eco Tourism", "Community Managed"],
    },
    {
      village: "Sauraha & Tharu Villages",
      region: "Chitwan, Terai",
      content: `Located on the edges of Chitwan National Park and the Rapti River, these indigenous Tharu villages offer an immersive journey into Terai culture and wildlife conservation.

Culture & Lifestyle:
The Tharu community has lived adjacent to the Terai jungles for centuries, historically immune to malaria and having deep symbiotic bonds with the forest. Their homes are built with hand-plastered mud, clay, elephant grass, and bamboo, painted with sacred folk motifs of peacocks, fish, and trees.

Highlights & Activities:
- Traditional Tharu Danda (Stick) Dance and Jhamta Dance around evening bonfires
- Guided village cycling tours through mustard fields
- Canoe rides along the Rapti River observing gharials and marsh muggers
- Authentic Tharu cuisine: Ghonghi (freshwater edible snails), Chhuchhuni, Anadi rice, and spicy river fish.`,
      tags: ["Tharu Culture", "Chitwan National Park", "Wildlife", "Terai Heritage", "Stick Dance"],
    },
    {
      village: "Ghale Gaun",
      region: "Lamjung",
      content: `Ghale Gaun (2,100m) is an exemplary model SAARC village nestled against the foothills of Lamjung Himal, Annapurna II, and Boudha Peak. It offers the quintessential Gurung cultural heritage in an alpine setting.

Traditions & Events:
Home to ancient Gurung royal lineage (Ghale kings). Travelers witness ancient honey hunting traditions, Gurung shamanic rituals (Ghyabre and Poju priests), and Ghatu dance performances.

Seasons & Atmosphere:
Spring turns the surrounding slopes into a scarlet carpet of rhododendrons, while autumn provides crisp morning vistas of the Annapurna range. Warm organic dining includes nettle soup (sisnu ko jhol), local corn, and dried buffalo sukuti.`,
      tags: ["SAARC Model Village", "Lamjung Himal", "Ghatu Dance", "Honey Hunting", "Alpine Trek"],
    },
    {
      village: "Panauti",
      region: "Kavrepalanchok",
      content: `Panauti is an ancient Newari settlement situated at the confluence of the sacred Roshi and Punyamati rivers, just 32 km southeast of Kathmandu. Dating back to the 13th century, it is famed for its non-earthquake resilience and heritage temples.

Community Homestay Network:
Panauti boasts one of the most successful women-led community homestay networks in Nepal, empowering local mothers and grandmothers. Guests learn how to cook Newari feasts, make pottery, and join local harvest festivals.

Highlights:
- Indreshwar Mahadev Temple (one of the oldest surviving multi-tiered pagoda temples in Nepal, 1294 AD)
- Brahmayani Temple and ancient ghats
- Panauti to Namobuddha day hike through green pine ridges and Tamang farming hamlets.`,
      tags: ["Women-Led Homestay", "Newari Heritage", "Pagoda Temples", "Cooking Class", "Day Trek"],
    },
    {
      village: "Tansen / Palpa",
      region: "Palpa, Western Nepal",
      content: `Perched on the southern slopes of Shreenagar Hill at 1,350m, Tansen is a historic hill town with winding cobbled streets, Newari merchant houses, and panoramic views of the Kali Gandaki river valley.

Crafts & Culinary Heritage:
- World-famous Palpali Dhaka fabric hand-woven on wooden looms
- Traditional Palpali Karuwa (cast-bronze water jug)
- Signature culinary specialties: Chukauni (spiced sour yogurt potato salad), Batuk (black lentil savory patties), and Hans ko Chhoila.

Nearby Excursions:
Rani Mahal (The Taj Mahal of Nepal), built in 1893 on the banks of the Kali Gandaki river by General Khadga Shumsher in memory of his beloved wife Tej Kumari.`,
      tags: ["Palpali Dhaka", "Rani Mahal", "Chukauni", "Magar Culture", "Historic Hill Station"],
    },
  ];

  for (const guide of villageGuidesData) {
    await prisma.villageGuide.create({ data: guide });
  }
  console.log(` ${villageGuidesData.length} Village Guides seeded.`);

  // 4. Seed 16 Homestays across the authentic villages
  const homestaysData = [
    // --- GHANDRUK ---
    {
      name: "Gurung Didi Homestay",
      slug: "gurung-didi-homestay-ghandruk",
      description: "Traditional stone cottage with a wide paved courtyard facing Annapurna South and Machapuchare. Experience authentic Gurung family warmth and organic home-cooked meals.",
      hostName: "Maya Gurung",
      hostBio: "Hosting travelers with warmth for over 14 years. Maya loves teaching guests how to cook gundruk and brew local herbal tea.",
      hostPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
      village: "Ghandruk",
      region: "Kaski, Annapurna",
      roomType: RoomType.PRIVATE,
      capacity: 3,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Hot Water", "Mountain View", "Organic Farm Food", "WiFi", "Evening Firepit"],
      pricePerNight: 2200,
      images: [
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Old Village Heritage Homestay",
      slug: "old-village-heritage-homestay-ghandruk",
      description: "Located near the historic Gurung museum, this 80-year-old restored stone house features hand-carved window frames and sweeping views of Hiunchuli peak.",
      hostName: "Suk Bahadur Gurung",
      hostBio: "Retired Gurkha soldier who returned to his ancestral home to preserve traditional Gurung architecture and organic terraced farming.",
      hostPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      village: "Ghandruk",
      region: "Kaski, Annapurna",
      roomType: RoomType.PRIVATE,
      capacity: 2,
      mealsIncluded: MealOption.BREAKFAST_DINNER,
      facilities: ["Hot Water", "Mountain View", "Organic Vegetables", "WiFi", "Cultural Museum Walk"],
      pricePerNight: 2000,
      images: [
        "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Himalayan Sunrise Homestay",
      slug: "himalayan-sunrise-homestay-ghandruk",
      description: "Perched at the upper rim of Ghandruk with an open rooftop terrace offering unobstructed golden sunrises over the Annapurna massif.",
      hostName: "Purna Gurung",
      hostBio: "Passionate local trekking guide and homestay operator with 20 years of Himalayan storytelling.",
      hostPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
      village: "Ghandruk",
      region: "Kaski, Annapurna",
      roomType: RoomType.FAMILY,
      capacity: 5,
      mealsIncluded: MealOption.BREAKFAST,
      facilities: ["Hot Water", "Sunrise Balcony", "WiFi", "Guide Service", "Loom Weaving Demo"],
      pricePerNight: 2800,
      images: [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      ],
    },

    // --- BANDIPUR ---
    {
      name: "Tin Dhara Heritage Homestay",
      slug: "tin-dhara-heritage-homestay-bandipur",
      description: "Authentic Newari red-brick residence near the natural springs of Tin Dhara. Features traditional carved wood fittings and stone-paved inner courtyard.",
      hostName: "Laxmi Shrestha",
      hostBio: "Laxmi is renowned in Bandipur for her homemade Yomari, fresh spicy Achar, and welcoming smile.",
      hostPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
      village: "Bandipur",
      region: "Tanahun",
      roomType: RoomType.PRIVATE,
      capacity: 2,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Hot Water", "Heritage Balcony", "Newari Cooking Class", "WiFi"],
      pricePerNight: 2400,
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Siddha Cave View Homestay",
      slug: "siddha-cave-view-homestay-bandipur",
      description: "Tucked on a tranquil orchard slope overlooking the Marsyangdi valley and the trail to Siddha Cave. Ideal for nature lovers and birdwatchers.",
      hostName: "Ram Kumar Shrestha",
      hostBio: "Local botanical enthusiast and organic orange farmer eager to guide travelers through hidden forest trails.",
      hostPhoto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
      village: "Bandipur",
      region: "Tanahun",
      roomType: RoomType.PRIVATE,
      capacity: 3,
      mealsIncluded: MealOption.BREAKFAST_DINNER,
      facilities: ["Hot Water", "Valley View", "Orange Orchard", "WiFi", "Cave Hiking Map"],
      pricePerNight: 2100,
      images: [
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Bandipur Hillside Haven",
      slug: "bandipur-hillside-haven",
      description: "Restored merchant home right off the cobblestone pedestrian street. Balconies with potted flowers and evening mountain silhouettes.",
      hostName: "Sita Pradhan",
      hostBio: "Third-generation Bandipur local who preserves family Newari recipes and hosts cultural tea evenings.",
      hostPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      village: "Bandipur",
      region: "Tanahun",
      roomType: RoomType.FAMILY,
      capacity: 4,
      mealsIncluded: MealOption.BREAKFAST,
      facilities: ["Hot Water", "Central Bazaar Access", "WiFi", "Rooftop View", "Traditional Tea"],
      pricePerNight: 2600,
      images: [
        "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
      ],
    },

    // --- SIRUBARI ---
    {
      name: "Sirubari Model Community Homestay #4",
      slug: "sirubari-model-homestay-4",
      description: "Award-winning stone home in Nepal's pioneer eco-village. Slate-roofed bedrooms, pure mountain spring water, and organic farm dining.",
      hostName: "Man Bahadur Gurung",
      hostBio: "Village elder and veteran community tourism leader who received the PATA Gold Award on behalf of Sirubari.",
      hostPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
      village: "Sirubari",
      region: "Syangja",
      roomType: RoomType.PRIVATE,
      capacity: 2,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Hot Water", "Farm Activities", "Cultural Welcome Tika", "Organic Milk & Honey"],
      pricePerNight: 1900,
      images: [
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Gurung Pride Eco Homestay",
      slug: "gurung-pride-eco-homestay-sirubari",
      description: "Cozy rooms lined with local timber and woolen rugs. Beautiful view of terraced millet fields and sacred Thumro Hill.",
      hostName: "Kausalya Gurung",
      hostBio: "Master of traditional loom weaving. Kausalya offers guests hands-on lessons in crafting traditional Gurung woolen shawls.",
      hostPhoto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
      village: "Sirubari",
      region: "Syangja",
      roomType: RoomType.SHARED,
      capacity: 4,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Hot Water", "Traditional Loom Demo", "Campfire", "Terraced Field Walks"],
      pricePerNight: 1600,
      images: [
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
      ],
    },

    // --- CHITWAN THARU VILLAGE ---
    {
      name: "Tharu Evergreen Cultural Homestay",
      slug: "tharu-evergreen-cultural-homestay-chitwan",
      description: "Traditional mud-plastered bamboo villa with colorful Tharu wall relief art. Minutes from the Rapti river and Chitwan National Park buffer zone.",
      hostName: "Som Tharu",
      hostBio: "Expert local naturalist and Tharu folk artist who shares folklore about wild elephants, rhinos, and jungle spirits.",
      hostPhoto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
      village: "Sauraha & Tharu Villages",
      region: "Chitwan, Terai",
      roomType: RoomType.PRIVATE,
      capacity: 3,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Ceiling Fan", "Attached Bath", "Tharu Stick Dance", "Bicycle Rental", "Jungle Walk Guide"],
      pricePerNight: 2300,
      images: [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Rhino View Riverside Homestay",
      slug: "rhino-view-riverside-homestay-chitwan",
      description: "Watch one-horned rhinos graze across the Rapti river directly from your wooden watchtower hammock. Fresh river breeze and organic papaya garden.",
      hostName: "Budhiram Chaudhary",
      hostBio: "Lifelong community forest guard and conservationist committed to protecting endangered wildlife alongside local culture.",
      hostPhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
      village: "Sauraha & Tharu Villages",
      region: "Chitwan, Terai",
      roomType: RoomType.FAMILY,
      capacity: 5,
      mealsIncluded: MealOption.BREAKFAST_DINNER,
      facilities: ["Watchtower Deck", "Attached Bath", "River Safari", "WiFi", "Evening BBQ"],
      pricePerNight: 2700,
      images: [
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Barandabhar Bufferzone Homestay",
      slug: "barandabhar-bufferzone-homestay-chitwan",
      description: "Quiet rural settlement nestled among golden mustard fields. Authentic clay stoves, fresh pond fish, and guided birdwatching at dawn.",
      hostName: "Rupa Mahato",
      hostBio: "Leader of the local women's forest conservation group. Rupa cooks delicious snail delicacy (Ghonghi) and herbal teas.",
      hostPhoto: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=80",
      village: "Sauraha & Tharu Villages",
      region: "Chitwan, Terai",
      roomType: RoomType.PRIVATE,
      capacity: 2,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Natural Clay Cooling", "Organic Fish Farm", "Birdwatching Tour", "Bicycle Free"],
      pricePerNight: 1800,
      images: [
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
      ],
    },

    // --- GHALE GAUN ---
    {
      name: "Ghale Gaun Eco Homestay",
      slug: "ghale-gaun-eco-homestay-lamjung",
      description: "High alpine ridge stay facing Lamjung Himal and Annapurna II. Experience traditional Gurung welcome ceremonies, evening cultural dance, and local honey.",
      hostName: "Prem Ghale",
      hostBio: "Cultural ambassador of Ghale Gaun who organizes annual traditional archery contests and honey harvesting trails.",
      hostPhoto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80",
      village: "Ghale Gaun",
      region: "Lamjung",
      roomType: RoomType.PRIVATE,
      capacity: 3,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Hot Water", "Panche Baja Welcome", "Panoramic Mountain View", "Campfire"],
      pricePerNight: 2000,
      images: [
        "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Lamjung Peak Homestay",
      slug: "lamjung-peak-homestay-ghale-gaun",
      description: "Cozy slate-walled cottage with a wooden deck perched directly above the cloud line. Unrivaled star gazing and early morning tea.",
      hostName: "Chandra Kumari Ghale",
      hostBio: "Chandra prepares legendary Dhindo with desi ghee, local chicken jhol, and stinging nettle (sisnu) soup.",
      hostPhoto: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80",
      village: "Ghale Gaun",
      region: "Lamjung",
      roomType: RoomType.PRIVATE,
      capacity: 2,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Hot Water", "Stargazing Deck", "Organic Dhindo & Sisnu", "Fireplace"],
      pricePerNight: 2100,
      images: [
        "https://images.unsplash.com/photo-1498855926480-d98e83099315?auto=format&fit=crop&w=1200&q=80",
      ],
    },

    // --- PANAUTI ---
    {
      name: "Panauti Community Homestay #2",
      slug: "panauti-community-homestay-2",
      description: "Part of the celebrated women-led Panauti Community Homestay network. Stay in an authentic Newari town home with tile courtyard and rooftop view of Indreshwar Temple.",
      hostName: "Shanti Prajapati",
      hostBio: "Pioneering woman entrepreneur in Panauti. Shanti loves hosting international travelers and teaching Yomari making.",
      hostPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
      village: "Panauti",
      region: "Kavrepalanchok",
      roomType: RoomType.PRIVATE,
      capacity: 2,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Hot Water", "Cooking Class", "Temple Heritage Walk", "WiFi", "Courtyard Garden"],
      pricePerNight: 2400,
      images: [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
      ],
    },

    // --- TANSEN / PALPA ---
    {
      name: "Ranighat Riverside Homestay",
      slug: "ranighat-riverside-homestay-palpa",
      description: "Located near the scenic gorge of Kali Gandaki on the trail to historical Rani Mahal palace. Surrounded by dense Sal forests and clear river pools.",
      hostName: "Bishnu Rana Magar",
      hostBio: "Local history buff and fisherman who shares stories about the Palpa kingdom and General Khadga Shumsher.",
      hostPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      village: "Tansen / Palpa",
      region: "Palpa, Western Nepal",
      roomType: RoomType.PRIVATE,
      capacity: 3,
      mealsIncluded: MealOption.ALL_MEALS,
      facilities: ["Hot Water", "River Swimming Guide", "Palpali Chukauni & Batuk", "Campfire"],
      pricePerNight: 2100,
      images: [
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Palpali Dhaka Heritage Home",
      slug: "palpali-dhaka-heritage-home-tansen",
      description: "Traditional hilltop home on the slope of Shreenagar hill. Hear the gentle rhythmic clatter of wooden handlooms weaving Dhaka cloth in the downstairs workshop.",
      hostName: "Durga Shakya",
      hostBio: "Master weaver carrying forward her family heritage of handloom Dhaka weaving for 35 years.",
      hostPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
      village: "Tansen / Palpa",
      region: "Palpa, Western Nepal",
      roomType: RoomType.PRIVATE,
      capacity: 2,
      mealsIncluded: MealOption.BREAKFAST_DINNER,
      facilities: ["Hot Water", "Handloom Workshop", "Shreenagar Hilltop Walk", "WiFi"],
      pricePerNight: 2300,
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ];

  const createdHomestays = [];
  for (const homestay of homestaysData) {
    const created = await prisma.homestay.create({ data: homestay });
    createdHomestays.push(created);
  }
  console.log(` ${createdHomestays.length} Homestays seeded successfully.`);

  // 5. Seed a Sample Booking & Review for the Demo Traveler
  const sampleHomestay = createdHomestays[0]; 
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() - 5); 
  const checkOutDate = new Date();
  checkOutDate.setDate(checkOutDate.getDate() - 3); 

  const sampleBooking = await prisma.booking.create({
    data: {
      homestayId: sampleHomestay.id,
      userId: traveler.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: 2,
      totalAmount: sampleHomestay.pricePerNight * 2,
      status: "CONFIRMED",
      paymentRef: "KHALTI_SANDBOX_DEMO_01",
    },
  });

  await prisma.review.create({
    data: {
      homestayId: sampleHomestay.id,
      userId: traveler.id,
      bookingId: sampleBooking.id,
      rating: 5,
      comment: "Staying with Maya Gurung was the highlight of our Annapurna trip! Her gundruk and fresh millet rotis were unbelievable. Sitting on the slate terrace watching Machapuchare turn pink at sunset is an unforgettable memory.",
    },
  });

  await prisma.notification.create({
    data: {
      userId: traveler.id,
      title: "Booking Completed",
      message: `Your stay at ${sampleHomestay.name} was completed. Thank you for traveling with HomestayNepal!`,
      read: true,
    },
  });

  console.log("Demo booking, review, and notification seeded.");
  console.log("Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
