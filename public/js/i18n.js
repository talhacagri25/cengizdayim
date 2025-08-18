// Multi-language support system for Turkish, English, and Azerbaijani

class I18nManager {
    constructor() {
        this.currentLanguage = this.getStoredLanguage() || 'tr';
        this.translations = {};
        this.init();
    }

    init() {
        this.loadTranslations();
        // this.setupLanguageSwitcher(); // Disabled - using new navbar implementation
        this.applyTranslations();
    }

    getStoredLanguage() {
        return localStorage.getItem('florist_language') || 'tr'; // Default to Turkish
    }

    setLanguage(lang) {
        if (!['en', 'tr', 'az', 'ru'].includes(lang)) return;
        
        this.currentLanguage = lang;
        localStorage.setItem('florist_language', lang);
        this.applyTranslations();
        this.updateLanguageSwitcher();
        
        // Dispatch language change event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
    }

    loadTranslations() {
        this.translations = {
            // English
            en: {
                // Navigation
                'nav.home': 'Home',
                'nav.featured': 'Featured',
                'nav.categories': 'Categories',
                'nav.shop': 'Shop',
                'nav.about': 'About',
                'nav.contact': 'Contact',
                'nav.track_order': 'Track Order',

                // Order Tracking
                'track.title': 'Track Order',
                'track.subtitle': 'Check your order status by entering your order number',
                'track.form_title': 'Track Your Order',
                'track.form_description': 'View real-time status by entering your order number',
                'track.order_number_label': 'Order Number',
                'track.order_number_placeholder': 'ORD-XXXXX-XXXXX',
                'track.order_number_help': 'Your order number was sent via email',
                'track.track_button': 'Track Order',
                'track.error_title': 'Order Not Found',
                'track.error_message': 'No order found matching the entered order number. Please check the number and try again.',
                'track.error_empty': 'Please enter an order number',
                'track.info_1_title': 'Order Status',
                'track.info_1_desc': 'Track your order through preparation, shipping and delivery stages',
                'track.info_2_title': 'Email Notifications',
                'track.info_2_desc': 'Changes in your order status are notified via email',
                'track.info_3_title': 'Customer Support',
                'track.info_3_desc': 'Contact us for your questions',
                'track.order_number': 'Order Number',
                'track.order_date': 'Order Date',
                'track.order_status': 'Order Status',
                'track.order_items': 'Order Items',
                'track.quantity': 'Quantity',
                'track.delivery_info': 'Delivery Information',
                'track.delivery_type': 'Delivery Type',
                'track.home_delivery': 'Home Delivery',
                'track.store_pickup': 'Store Pickup',
                'track.delivery_address': 'Delivery Address',
                'track.payment_summary': 'Payment Summary',
                'track.subtotal': 'Subtotal',
                'track.delivery_fee': 'Delivery Fee',
                'track.total': 'Total',
                
                // Order Status
                'status.pending': 'Pending',
                'status.pending_desc': 'Your order has been received and is awaiting confirmation',
                'status.confirmed': 'Confirmed',
                'status.confirmed_desc': 'Your order has been confirmed and is being prepared',
                'status.preparing': 'Preparing',
                'status.preparing_desc': 'Your beautiful plants are being carefully prepared',
                'status.ready': 'Ready',
                'status.ready_desc': 'Your order is ready for delivery or pickup',
                'status.delivered': 'Delivered',
                'status.delivered_desc': 'Your order has been successfully delivered',
                'status.cancelled': 'Cancelled',
                'status.cancelled_desc': 'Your order has been cancelled',

                // Homepage
                'hero.title': 'Where Nature Meets Beauty',
                'hero.subtitle': 'Discover our enchanting collection of plants and flowers, carefully curated to bring life and beauty to your space',
                'hero.shop_now': 'Shop Now',
                'hero.explore': 'Explore Collection',
                'hero.scroll_explore': 'Scroll to explore',

                'featured.title': 'Featured Plants',
                'featured.subtitle': 'Hand-picked favorites that bring life and beauty to any space',

                'categories.title': 'Plant Categories',
                'categories.subtitle': 'Explore our diverse collection organized by plant type and care requirements',

                'about.title': 'About Hayat Flora',
                'about.description1': 'Welcome to our enchanting world of flowers and plants. We specialize in creating stunning arrangements and providing healthy, beautiful plants for your home and garden.',
                'about.description2': 'With years of expertise in horticulture and a passion for nature\'s beauty, we carefully select each plant to ensure it thrives in your care. From beginners to experienced gardeners, we have something special for everyone.',
                'about.explore_collection': 'Explore Our Collection',

                'features.expert_care': 'Expert Care Advice',
                'features.expert_care_desc': 'Detailed care instructions for every plant',
                'features.fast_delivery': 'Fast Delivery',
                'features.fast_delivery_desc': 'Same-day delivery available for local orders',
                'features.healthy_guarantee': 'Healthy Guarantee',
                'features.healthy_guarantee_desc': 'All plants guaranteed healthy and thriving',
                'features.home_garden': 'Home & Garden',
                'features.home_garden_desc': 'Perfect plants for indoor and outdoor spaces',

                'contact.title': 'Visit Our Store',
                'contact.subtitle': 'Come see our plants in person and get expert advice from our team',
                'contact.store_info': 'Store Information',
                'contact.address': 'Address:',
                'contact.phone': 'Phone:',
                'contact.email': 'Email:',
                'contact.hours': 'Hours:',
                'contact.delivery_info': 'Delivery Information',
                'contact.free_delivery': 'Free Delivery:',
                'contact.free_delivery_desc': 'Free delivery within Bursa city center',
                'contact.same_day': 'Same-Day Delivery:',
                'contact.same_day_desc': 'Available for orders placed before 2 PM',
                'contact.care_package': 'Plant Care Package:',
                'contact.care_package_desc': 'Every delivery includes care instructions and plant food',
                'contact.health_guarantee': 'Plant Health Guarantee:',
                'contact.health_guarantee_desc': '7-day guarantee on all delivered plants',

                // Shop page
                'shop.title': 'Plant Collection',
                'shop.subtitle': 'Discover the perfect plants for your space',
                'shop.search_placeholder': 'Search plants...',
                'shop.all_categories': 'All Categories',
                'shop.all_prices': 'All Prices',
                'shop.featured': 'Featured',
                'shop.name_az': 'Name A-Z',
                'shop.price_low_high': 'Price: Low to High',
                'shop.price_high_low': 'Price: High to Low',
                'shop.newest_first': 'Newest First',
                'shop.category_label': 'Category:',
                'shop.price_label': 'Price Range:',
                'shop.sort_label': 'Sort By:',
                'shop.price_0_25': '$0 - $25',
                'shop.price_25_50': '$25 - $50',
                'shop.price_50_100': '$50 - $100',
                'shop.price_100_plus': '$100+',
                'shop.show_filters': 'Show Filters',
                'shop.clear_filters': 'Clear Filters',
                'shop.grid_view': 'Grid View',
                'shop.list_view': 'List View',
                'shop.showing_results': 'Showing {start}-{end} of {total} plants',
                'shop.no_plants_found': 'No plants found',
                'shop.no_plants_desc': 'Try adjusting your search or filters to find more plants.',
                'shop.clear_all_filters': 'Clear All Filters',
                'shop.newsletter_title': 'Stay Updated',
                'shop.newsletter_subtitle': 'Get notified about new plants, care tips, and special offers',
                'shop.newsletter_placeholder': 'Enter your email address',
                'shop.subscribe': 'Subscribe',

                // Product
                'product.view_details': 'View Details',
                'product.add_to_cart': 'Add to Cart',
                'product.out_of_stock': 'Out of Stock',
                'product.in_stock': 'in stock',
                'product.sale': 'Sale!',
                'product.featured': '⭐ Featured',
                'product.related_title': 'Related Plants',
                'product.related_subtitle': 'You might also like these plants',

                // Cart
                'cart.title': 'Shopping Cart',
                'cart.items': 'items',
                'cart.empty': 'Your cart is empty',
                'cart.empty_desc': 'Looks like you haven\'t added any plants yet.',
                'cart.continue_shopping': 'Continue Shopping',
                'cart.item': 'Item',
                'cart.quantity': 'Quantity',
                'cart.price': 'Price',
                'cart.total': 'Total',
                'cart.remove': 'Remove',
                'cart.update': 'Update',
                'cart.subtotal': 'Subtotal',
                'cart.delivery': 'Delivery',
                'cart.free': 'Free',
                'cart.proceed_checkout': 'Proceed to Checkout',
                'cart.recommended_title': 'You Might Also Like',
                'cart.recommended_subtitle': 'Complete your garden with these beautiful plants',
                'cart.order_summary': 'Order Summary',
                'cart.delivery_options': 'Delivery Options',
                'cart.free_delivery': 'Free Delivery',
                'cart.free_delivery_desc': '5-7 business days',
                'cart.express_delivery': 'Express Delivery',
                'cart.express_delivery_desc': '2-3 business days',
                'cart.same_day_delivery': 'Same Day Delivery',
                'cart.same_day_desc': 'Order before 2 PM',
                'cart.quantity_updated': 'Quantity updated',
                'cart.stock_limit': 'Stock limit reached',
                'cart.item_removed': 'Item removed from cart',
                'cart.delivery_updated': 'Delivery option updated',
                'cart.empty_checkout': 'Your cart is empty',

                // Checkout
                'checkout.title': 'Checkout',
                'checkout.customer_info': 'Customer Information',
                'checkout.full_name': 'Full Name',
                'checkout.email': 'Email Address',
                'checkout.phone': 'Phone Number',
                'checkout.delivery_info': 'Delivery Information',
                'checkout.delivery_type': 'Delivery Type',
                'checkout.home_delivery': 'Home Delivery',
                'checkout.store_pickup': 'Store Pickup',
                'checkout.delivery_address': 'Delivery Address',
                'checkout.order_notes': 'Order Notes (Optional)',
                'checkout.order_summary': 'Order Summary',
                'checkout.place_order': 'Place Order',
                'checkout.cart': 'Cart',
                'checkout.information': 'Information',
                'checkout.confirmation': 'Confirmation',
                'checkout.secure_payment': 'Secure Payment',
                'checkout.secure_payment_desc': 'Your information is protected with SSL encryption',
                'checkout.fast_delivery': 'Fast Delivery',
                'checkout.fast_delivery_desc': 'Same-day delivery available for local orders',
                'checkout.plant_guarantee': 'Plant Guarantee',
                'checkout.plant_guarantee_desc': '7-day healthy plant guarantee',
                'checkout.support': '24/7 Support',
                'checkout.support_desc': 'Expert plant care advice available',
                'checkout.order_success': 'Order Placed Successfully!',
                'checkout.order_number': 'Order Number',
                'checkout.confirmation_email': 'A confirmation email has been sent to your email address.',
                'checkout.preferred_language': 'Preferred Language',
                'checkout.additional_info': 'Additional Information',
                'checkout.empty_desc': 'Add some plants to your cart before proceeding to checkout.',
                'checkout.pickup_desc': 'Pick up from our store - Ready in 2 hours',
                'checkout.notes_placeholder': 'Special instructions for delivery, plant care requests, etc.',
                'checkout.name_required': 'Name is required',
                'checkout.name_min_length': 'Name must be at least 2 characters',
                'checkout.name_invalid': 'Please enter a valid name',
                'checkout.email_required': 'Email is required',
                'checkout.email_invalid': 'Please enter a valid email address',
                'checkout.phone_required': 'Phone number is required',
                'checkout.phone_invalid': 'Please enter a valid phone number',
                'checkout.phone_min_length': 'Phone number must be at least 10 digits',
                'checkout.address_required': 'Address is required',
                'checkout.address_min_length': 'Address must be at least 10 characters',

                // Categories
                'category.indoor_plants': 'Indoor Plants',
                'category.indoor_plants_desc': 'Perfect plants for your home interior',
                'category.outdoor_plants': 'Outdoor Plants',
                'category.outdoor_plants_desc': 'Beautiful plants for gardens and patios',
                'category.flowering_plants': 'Flowering Plants',
                'category.flowering_plants_desc': 'Colorful blooming plants',
                'category.succulents': 'Succulents',
                'category.succulents_desc': 'Low-maintenance water-storing plants',
                'category.herbs_vegetables': 'Herbs & Vegetables',
                'category.herbs_vegetables_desc': 'Grow your own fresh herbs and vegetables',
                'category.trees_shrubs': 'Trees & Shrubs',
                'category.trees_shrubs_desc': 'Larger plants for landscaping',

                // Common
                'common.loading': 'Loading...',
                'common.error': 'Something went wrong. Please try again.',
                'common.try_again': 'Try Again',
                'common.close': 'Close',
                'common.save': 'Save',
                'common.cancel': 'Cancel',
                'common.delete': 'Delete',
                'common.edit': 'Edit',
                'common.add': 'Add',
                'common.search': 'Search',
                'common.filter': 'Filter',
                'common.sort': 'Sort',
                'common.clear': 'Clear',
                'common.next': 'Next',
                'common.previous': 'Previous',
                'common.page': 'Page',
                'common.of': 'of',

                // Footer
                'footer.tagline': 'Your trusted partner in bringing nature\'s beauty to your doorstep. Quality plants, expert care, exceptional service.',
                'footer.quick_links': 'Quick Links',
                'footer.customer_care': 'Customer Care',
                'footer.plant_care_guide': 'Plant Care Guide',
                'footer.delivery_info': 'Delivery Information',
                'footer.return_policy': 'Return Policy',
                'footer.contact_support': 'Contact Support',
                'footer.connect': 'Connect With Us',
                'footer.connect_desc': 'Follow us for plant care tips, new arrivals, and seasonal specials!',
                'footer.copyright': '© 2025 Hayat Flora. All rights reserved.',

                // Language
                'lang.english': 'English',
                'lang.turkish': 'Türkçe',
                'lang.azerbaijani': 'Azərbaycanca',
                'lang.russian': 'Русский'
            },

            // Turkish
            tr: {
                // Navigation
                'nav.home': 'Ana Sayfa',
                'nav.featured': 'Öne Çıkan',
                'nav.categories': 'Kategoriler',
                'nav.shop': 'Mağaza',
                'nav.about': 'Hakkımızda',
                'nav.contact': 'İletişim',
                'nav.track_order': 'Sipariş Takip',

                // Order Tracking
                'track.title': 'Sipariş Takip',
                'track.subtitle': 'Sipariş numaranızı girerek siparişinizin durumunu kontrol edebilirsiniz',
                'track.form_title': 'Siparişinizi Takip Edin',
                'track.form_description': 'Sipariş numaranızı girerek anlık durumu görüntüleyin',
                'track.order_number_label': 'Sipariş Numarası',
                'track.order_number_placeholder': 'ORD-XXXXX-XXXXX',
                'track.order_number_help': 'Sipariş numaranız e-posta ile gönderilmiştir',
                'track.track_button': 'Siparişi Takip Et',
                'track.error_title': 'Sipariş Bulunamadı',
                'track.error_message': 'Girdiğiniz sipariş numarası ile eşleşen bir sipariş bulunamadı. Lütfen numarayı kontrol edip tekrar deneyin.',
                'track.error_empty': 'Lütfen bir sipariş numarası girin',
                'track.info_1_title': 'Sipariş Durumları',
                'track.info_1_desc': 'Siparişiniz hazırlık, kargo ve teslimat aşamalarını takip edebilirsiniz',
                'track.info_2_title': 'E-posta Bildirimleri',
                'track.info_2_desc': 'Sipariş durumunuzdaki değişiklikler e-posta ile bildirilir',
                'track.info_3_title': 'Müşteri Desteği',
                'track.info_3_desc': 'Sorularınız için bize ulaşabilirsiniz',
                'track.order_number': 'Sipariş No',
                'track.order_date': 'Sipariş Tarihi',
                'track.order_status': 'Sipariş Durumu',
                'track.order_items': 'Sipariş Ürünleri',
                'track.quantity': 'Adet',
                'track.delivery_info': 'Teslimat Bilgileri',
                'track.delivery_type': 'Teslimat Türü',
                'track.home_delivery': 'Ev Teslimi',
                'track.store_pickup': 'Mağazadan Alım',
                'track.delivery_address': 'Teslimat Adresi',
                'track.payment_summary': 'Ödeme Özeti',
                'track.subtotal': 'Ara Toplam',
                'track.delivery_fee': 'Teslimat Ücreti',
                'track.total': 'Toplam',
                
                // Order Status
                'status.pending': 'Bekliyor',
                'status.pending_desc': 'Siparişiniz alındı ve onay bekliyor',
                'status.confirmed': 'Onaylandı',
                'status.confirmed_desc': 'Siparişiniz onaylandı ve hazırlanıyor',
                'status.preparing': 'Hazırlanıyor',
                'status.preparing_desc': 'Güzel bitkileriniz özenle hazırlanıyor',
                'status.ready': 'Hazır',
                'status.ready_desc': 'Siparişiniz teslimat veya alım için hazır',
                'status.delivered': 'Teslim Edildi',
                'status.delivered_desc': 'Siparişiniz başarıyla teslim edildi',
                'status.cancelled': 'İptal Edildi',
                'status.cancelled_desc': 'Siparişiniz iptal edildi',

                // Homepage
                'hero.title': 'Doğa ile Güzelliğin Buluştuğu Yer',
                'hero.subtitle': 'Alanınıza hayat ve güzellik katmak için özenle seçilmiş büyüleyici bitki ve çiçek koleksiyonumuzu keşfedin',
                'hero.shop_now': 'Hemen Alışveriş Yap',
                'hero.explore': 'Koleksiyonu Keşfet',
                'hero.scroll_explore': 'Keşfetmek için kaydır',

                'featured.title': 'Öne Çıkan Bitkiler',
                'featured.subtitle': 'Her alana hayat ve güzellik katan, özenle seçilmiş favoriler',

                'categories.title': 'Bitki Kategorileri',
                'categories.subtitle': 'Bitki türü ve bakım gereksinimlerine göre düzenlenmiş çeşitli koleksiyonumuzu keşfedin',

                'about.title': 'Hayat Flora Hakkında',
                'about.description1': 'Büyüleyici çiçek ve bitki dünyamıza hoş geldiniz. Çarpıcı düzenlemeler oluşturma ve eviniz ile bahçeniz için sağlıklı, güzel bitkiler sağlama konusunda uzmanız.',
                'about.description2': 'Yıllarca süren bahçıvanlık uzmanlığı ve doğanın güzelliğine olan tutkumuzla, her bitkiyi bakımınızda gelişeceğinden emin olmak için özenle seçiyoruz. Acemilerden deneyimli bahçıvanlara kadar herkes için özel bir şeyimiz var.',
                'about.explore_collection': 'Koleksiyonumuzu Keşfedin',

                'features.expert_care': 'Uzman Bakım Tavsiyeleri',
                'features.expert_care_desc': 'Her bitki için detaylı bakım talimatları',
                'features.fast_delivery': 'Hızlı Teslimat',
                'features.fast_delivery_desc': 'Yerel siparişler için aynı gün teslimat mevcut',
                'features.healthy_guarantee': 'Sağlık Garantisi',
                'features.healthy_guarantee_desc': 'Tüm bitkiler sağlıklı ve canlı olarak garanti edilir',
                'features.home_garden': 'Ev & Bahçe',
                'features.home_garden_desc': 'İç ve dış mekanlar için mükemmel bitkiler',

                'contact.title': 'Mağazamızı Ziyaret Edin',
                'contact.subtitle': 'Bitkilerimizi bizzat görün ve ekibimizden uzman tavsiyeleri alın',
                'contact.store_info': 'Mağaza Bilgileri',
                'contact.address': 'Adres:',
                'contact.phone': 'Telefon:',
                'contact.email': 'E-posta:',
                'contact.hours': 'Çalışma Saatleri:',
                'contact.delivery_info': 'Teslimat Bilgileri',
                'contact.free_delivery': 'Ücretsiz Teslimat:',
                'contact.free_delivery_desc': 'Bursa şehir merkezi içinde ücretsiz teslimat',
                'contact.same_day': 'Aynı Gün Teslimat:',
                'contact.same_day_desc': 'Saat 14:00\'ten önce verilen siparişler için mevcut',
                'contact.care_package': 'Bitki Bakım Paketi:',
                'contact.care_package_desc': 'Her teslimat bakım talimatları ve bitki gıdası içerir',
                'contact.health_guarantee': 'Bitki Sağlık Garantisi:',
                'contact.health_guarantee_desc': 'Teslim edilen tüm bitkiler için 7 günlük garanti',

                // Shop page
                'shop.title': 'Bitki Koleksiyonu',
                'shop.subtitle': 'Alanınız için mükemmel bitkileri keşfedin',
                'shop.search_placeholder': 'Bitki ara...',
                'shop.all_categories': 'Tüm Kategoriler',
                'shop.all_prices': 'Tüm Fiyatlar',
                'shop.featured': 'Öne Çıkan',
                'shop.name_az': 'İsim A-Z',
                'shop.price_low_high': 'Fiyat: Düşükten Yükseğe',
                'shop.price_high_low': 'Fiyat: Yüksekten Düşüğe',
                'shop.newest_first': 'Önce En Yeniler',
                'shop.category_label': 'Kategori:',
                'shop.price_label': 'Fiyat Aralığı:',
                'shop.sort_label': 'Sırala:',
                'shop.price_0_25': '$0 - $25',
                'shop.price_25_50': '$25 - $50',
                'shop.price_50_100': '$50 - $100',
                'shop.price_100_plus': '$100+',
                'shop.show_filters': 'Filtreleri Göster',
                'shop.clear_filters': 'Filtreleri Temizle',
                'shop.grid_view': 'Izgara Görünümü',
                'shop.list_view': 'Liste Görünümü',
                'shop.showing_results': '{total} bitkiden {start}-{end} arası gösteriliyor',
                'shop.no_plants_found': 'Bitki bulunamadı',
                'shop.no_plants_desc': 'Daha fazla bitki bulmak için arama veya filtrelerinizi ayarlamayı deneyin.',
                'shop.clear_all_filters': 'Tüm Filtreleri Temizle',
                'shop.newsletter_title': 'Güncel Kalın',
                'shop.newsletter_subtitle': 'Yeni bitkiler, bakım ipuçları ve özel tekliflerden haberdar olun',
                'shop.newsletter_placeholder': 'E-posta adresinizi girin',
                'shop.subscribe': 'Abone Ol',

                // Product
                'product.view_details': 'Detayları Görüntüle',
                'product.add_to_cart': 'Sepete Ekle',
                'product.out_of_stock': 'Stokta Yok',
                'product.in_stock': 'stokta',
                'product.sale': 'İndirim!',
                'product.featured': '⭐ Öne Çıkan',
                'product.related_title': 'İlgili Bitkiler',
                'product.related_subtitle': 'Bunları da beğenebilirsiniz',

                // Cart
                'cart.title': 'Alışveriş Sepeti',
                'cart.items': 'ürün',
                'cart.empty': 'Sepetiniz boş',
                'cart.empty_desc': 'Henüz hiç bitki eklememişsiniz gibi görünüyor.',
                'cart.continue_shopping': 'Alışverişe Devam Et',
                'cart.item': 'Ürün',
                'cart.quantity': 'Adet',
                'cart.price': 'Fiyat',
                'cart.total': 'Toplam',
                'cart.remove': 'Kaldır',
                'cart.update': 'Güncelle',
                'cart.subtotal': 'Ara Toplam',
                'cart.delivery': 'Teslimat',
                'cart.free': 'Ücretsiz',
                'cart.proceed_checkout': 'Ödemeye Geç',
                'cart.recommended_title': 'Bunları da Beğenebilirsiniz',
                'cart.recommended_subtitle': 'Bahçenizi bu güzel bitkilerle tamamlayın',
                'cart.order_summary': 'Sipariş Özeti',
                'cart.delivery_options': 'Teslimat Seçenekleri',
                'cart.free_delivery': 'Ücretsiz Teslimat',
                'cart.free_delivery_desc': '5-7 iş günü',
                'cart.express_delivery': 'Hızlı Teslimat',
                'cart.express_delivery_desc': '2-3 iş günü',
                'cart.same_day_delivery': 'Aynı Gün Teslimat',
                'cart.same_day_desc': 'Saat 14:00\'a kadar sipariş verin',
                'cart.quantity_updated': 'Miktar güncellendi',
                'cart.stock_limit': 'Stok limitine ulaşıldı',
                'cart.item_removed': 'Ürün sepetten kaldırıldı',
                'cart.delivery_updated': 'Teslimat seçeneği güncellendi',
                'cart.empty_checkout': 'Sepetiniz boş',

                // Checkout
                'checkout.title': 'Ödeme',
                'checkout.customer_info': 'Müşteri Bilgileri',
                'checkout.full_name': 'Ad Soyad',
                'checkout.email': 'E-posta Adresi',
                'checkout.phone': 'Telefon Numarası',
                'checkout.delivery_info': 'Teslimat Bilgileri',
                'checkout.delivery_type': 'Teslimat Türü',
                'checkout.home_delivery': 'Ev Teslimatı',
                'checkout.store_pickup': 'Mağazadan Teslim Alma',
                'checkout.delivery_address': 'Teslimat Adresi',
                'checkout.order_notes': 'Sipariş Notları (İsteğe Bağlı)',
                'checkout.order_summary': 'Sipariş Özeti',
                'checkout.place_order': 'Siparişi Ver',
                'checkout.cart': 'Sepet',
                'checkout.information': 'Bilgiler',
                'checkout.confirmation': 'Onay',
                'checkout.secure_payment': 'Güvenli Ödeme',
                'checkout.secure_payment_desc': 'Bilgileriniz SSL şifreleme ile korunmaktadır',
                'checkout.fast_delivery': 'Hızlı Teslimat',
                'checkout.fast_delivery_desc': 'Yerel siparişler için aynı gün teslimat mevcut',
                'checkout.plant_guarantee': 'Bitki Garantisi',
                'checkout.plant_guarantee_desc': '7 günlük sağlıklı bitki garantisi',
                'checkout.support': '7/24 Destek',
                'checkout.support_desc': 'Uzman bitki bakım tavsiyeleri',
                'checkout.order_success': 'Siparişiniz Başarıyla Alındı!',
                'checkout.order_number': 'Sipariş Numarası',
                'checkout.confirmation_email': 'Onay e-postası adresinize gönderildi.',
                'checkout.preferred_language': 'Tercih Edilen Dil',
                'checkout.additional_info': 'Ek Bilgiler',
                'checkout.empty_desc': 'Ödeme işlemine devam etmeden önce sepetinize bitkiler ekleyin.',
                'checkout.pickup_desc': 'Mağazamızdan teslim alın - 2 saat içinde hazır',
                'checkout.notes_placeholder': 'Teslimat için özel talimatlar, bitki bakım istekleri vb.',
                'checkout.name_required': 'Ad soyad gereklidir',
                'checkout.name_min_length': 'Ad soyad en az 2 karakter olmalıdır',
                'checkout.name_invalid': 'Lütfen geçerli bir ad soyad girin',
                'checkout.email_required': 'E-posta gereklidir',
                'checkout.email_invalid': 'Lütfen geçerli bir e-posta adresi girin',
                'checkout.phone_required': 'Telefon numarası gereklidir',
                'checkout.phone_invalid': 'Lütfen geçerli bir telefon numarası girin',
                'checkout.phone_min_length': 'Telefon numarası en az 10 haneli olmalıdır',
                'checkout.address_required': 'Adres gereklidir',
                'checkout.address_min_length': 'Adres en az 10 karakter olmalıdır',

                // Categories
                'category.indoor_plants': 'İç Mekan Bitkileri',
                'category.indoor_plants_desc': 'Ev içiniz için mükemmel bitkiler',
                'category.outdoor_plants': 'Dış Mekan Bitkileri',
                'category.outdoor_plants_desc': 'Bahçe ve veranda için güzel bitkiler',
                'category.flowering_plants': 'Çiçekli Bitkiler',
                'category.flowering_plants_desc': 'Renkli çiçek açan bitkiler',
                'category.succulents': 'Sukulent Bitkiler',
                'category.succulents_desc': 'Az bakım gerektiren su depolayan bitkiler',
                'category.herbs_vegetables': 'Otlar ve Sebzeler',
                'category.herbs_vegetables_desc': 'Kendi taze otlarınızı ve sebzelerinizi yetiştirin',
                'category.trees_shrubs': 'Ağaç ve Çalılar',
                'category.trees_shrubs_desc': 'Peyzaj için büyük bitkiler',

                // Common
                'common.loading': 'Yükleniyor...',
                'common.error': 'Bir şeyler ters gitti. Lütfen tekrar deneyin.',
                'common.try_again': 'Tekrar Dene',
                'common.close': 'Kapat',
                'common.save': 'Kaydet',
                'common.cancel': 'İptal',
                'common.delete': 'Sil',
                'common.edit': 'Düzenle',
                'common.add': 'Ekle',
                'common.search': 'Ara',
                'common.filter': 'Filtrele',
                'common.sort': 'Sırala',
                'common.clear': 'Temizle',
                'common.next': 'Sonraki',
                'common.previous': 'Önceki',
                'common.page': 'Sayfa',
                'common.of': 'of',

                // Footer
                'footer.tagline': 'Doğanın güzelliğini kapınıza getirme konusunda güvenilir ortağınız. Kaliteli bitkiler, uzman bakım, istisnai hizmet.',
                'footer.quick_links': 'Hızlı Bağlantılar',
                'footer.customer_care': 'Müşteri Hizmetleri',
                'footer.plant_care_guide': 'Bitki Bakım Rehberi',
                'footer.delivery_info': 'Teslimat Bilgileri',
                'footer.return_policy': 'İade Politikası',
                'footer.contact_support': 'Destek İletişimi',
                'footer.connect': 'Bizimle Bağlantı Kurun',
                'footer.connect_desc': 'Bitki bakım ipuçları, yeni gelenler ve mevsimlik özel teklifler için bizi takip edin!',
                'footer.copyright': '© 2025 Hayat Flora. Tüm hakları saklıdır.',

                // Language
                'lang.english': 'English',
                'lang.turkish': 'Türkçe',
                'lang.azerbaijani': 'Azərbaycanca',
                'lang.russian': 'Русский'
            },

            // Azerbaijani
            az: {
                // Navigation
                'nav.home': 'Ana Səhifə',
                'nav.featured': 'Seçilmişlər',
                'nav.categories': 'Kateqoriyalar',
                'nav.shop': 'Mağaza',
                'nav.about': 'Haqqımızda',
                'nav.contact': 'Əlaqə',
                'nav.track_order': 'Sifariş İzləmə',

                // Order Tracking
                'track.title': 'Sifariş İzləmə',
                'track.subtitle': 'Sifariş nömrənizi daxil edərək sifarişinizin vəziyyətini yoxlayın',
                'track.form_title': 'Sifarişinizi İzləyin',
                'track.form_description': 'Sifariş nömrənizi daxil edərək canlı vəziyyəti görüntüləyin',
                'track.order_number_label': 'Sifariş Nömrəsi',
                'track.order_number_placeholder': 'ORD-XXXXX-XXXXX',
                'track.order_number_help': 'Sifariş nömrəniz e-poçt vasitəsilə göndərilmişdir',
                'track.track_button': 'Sifarişi İzlə',
                'track.error_title': 'Sifariş Tapılmadı',
                'track.error_message': 'Daxil etdiyiniz sifariş nömrəsi ilə uyğun sifariş tapılmadı. Zəhmət olmasa nömrəni yoxlayın və yenidən cəhd edin.',
                'track.error_empty': 'Zəhmət olmasa sifariş nömrəsi daxil edin',
                'track.info_1_title': 'Sifariş Vəziyyəti',
                'track.info_1_desc': 'Sifarişinizi hazırlıq, göndərmə və çatdırılma mərhələlərində izləyin',
                'track.info_2_title': 'E-poçt Bildirişləri',
                'track.info_2_desc': 'Sifariş vəziyyətinizdəki dəyişikliklər e-poçt vasitəsilə bildiriləcək',
                'track.info_3_title': 'Müştəri Dəstəyi',
                'track.info_3_desc': 'Suallarınız üçün bizimlə əlaqə saxlayın',
                'track.order_number': 'Sifariş Nömrəsi',
                'track.order_date': 'Sifariş Tarixi',
                'track.order_status': 'Sifariş Vəziyyəti',
                'track.order_items': 'Sifariş Məhsulları',
                'track.quantity': 'Miqdar',
                'track.delivery_info': 'Çatdırılma Məlumatı',
                'track.delivery_type': 'Çatdırılma Növü',
                'track.home_delivery': 'Evə Çatdırılma',
                'track.store_pickup': 'Mağazadan Götürmə',
                'track.delivery_address': 'Çatdırılma Ünvanı',
                'track.payment_summary': 'Ödəniş Xülasəsi',
                'track.subtotal': 'Cəmi',
                'track.delivery_fee': 'Çatdırılma Haqqı',
                'track.total': 'Ümumi',

                // Order Status
                'status.pending': 'Gözləyir',
                'status.pending_desc': 'Sifarişiniz alınıb və təsdiq gözləyir',
                'status.confirmed': 'Təsdiqləndi',
                'status.confirmed_desc': 'Sifarişiniz təsdiqləndi və hazırlanır',
                'status.preparing': 'Hazırlanır',
                'status.preparing_desc': 'Gözəl bitkiləriniz diqqətlə hazırlanır',
                'status.ready': 'Hazırdır',
                'status.ready_desc': 'Sifarişiniz çatdırılma və ya götürmə üçün hazırdır',
                'status.delivered': 'Çatdırıldı',
                'status.delivered_desc': 'Sifarişiniz uğurla çatdırıldı',
                'status.cancelled': 'Ləğv edildi',
                'status.cancelled_desc': 'Sifarişiniz ləğv edildi',

                // Homepage
                'hero.title': 'Təbiətin Gözəlliklərlə Buluşduğu Yer',
                'hero.subtitle': 'Məkanınıza həyat və gözəllik gətirmək üçün diqqətlə seçilmiş sehrli bitki və çiçək kolleksiyamızı kəşf edin',
                'hero.shop_now': 'İndi Alış-Veriş Et',
                'hero.explore': 'Kolleksiyanı Kəşf Et',
                'hero.scroll_explore': 'Kəşf etmək üçün aşağı sürüşdür',

                'featured.title': 'Seçilmiş Bitkilər',
                'featured.subtitle': 'Hər mətbəxə həyat və gözəllik gətirən əllə seçilmiş sevimli bitkilər',

                'categories.title': 'Bitki Kateqoriyaları',
                'categories.subtitle': 'Bitki növü və baxım tələblərinə görə təşkil edilmiş müxtəlif kolleksiyamızı kəşf edin',

                'about.title': 'Hayat Flora Haqqında',
                'about.description1': 'Sehrli çiçək və bitki dünyamıza xoş gəlmisiniz. Biz heyrətamiz kompozisiyalar yaratmaq və eviniz və bağınız üçün sağlam, gözəl bitkilər təmin etmək sahəsində ixtisaslaşırıq.',
                'about.description2': 'İllər boyu davam edən bağçılıq təcrübəsi və təbiətin gözəlliyinə olan eşqimizlə, hər bitkini sizin baxımınızda inkişaf edəcəyindən əmin olmaq üçün diqqətlə seçirik. Yeni başlayanlardan təcrübəli bağçılara kimi hər kəs üçün xüsusi bir şeyimiz var.',
                'about.explore_collection': 'Kolleksiyamızı Kəşf Edin',

                'features.expert_care': 'Mütəxəssis Baxım Məsləhətləri',
                'features.expert_care_desc': 'Hər bitki üçün ətraflı baxım təlimatları',
                'features.fast_delivery': 'Sürətli Çatdırılma',
                'features.fast_delivery_desc': 'Yerli sifarişlər üçün eyni gün çatdırılma mövcuddur',
                'features.healthy_guarantee': 'Sağlamlıq Zəmanəti',
                'features.healthy_guarantee_desc': 'Bütün bitkilər sağlam və canlı olaraq zəmanət verilir',
                'features.home_garden': 'Ev və Bağ',
                'features.home_garden_desc': 'Daxili və xarici məkanlar üçün mükəmməl bitkilər',

                'contact.title': 'Mağazamızı Ziyarət Edin',
                'contact.subtitle': 'Bitkilərimizi şəxsən görün və komandamızdan mütəxəssis məsləhətlər alın',
                'contact.store_info': 'Mağaza Məlumatları',
                'contact.address': 'Ünvan:',
                'contact.phone': 'Telefon:',
                'contact.email': 'E-poçt:',
                'contact.hours': 'Saatlar:',
                'contact.delivery_info': 'Çatdırılma Məlumatları',
                'contact.free_delivery': 'Pulsuz Çatdırılma:',
                'contact.free_delivery_desc': 'Bursa şəhər mərkəzi daxilində pulsuz çatdırılma',
                'contact.same_day': 'Eyni Gün Çatdırılma:',
                'contact.same_day_desc': 'Saat 14:00-dan əvvəl verilən sifarişlər üçün mövcuddur',
                'contact.care_package': 'Bitki Baxım Paketi:',
                'contact.care_package_desc': 'Hər çatdırılma baxım təlimatları və bitki qidası daxildir',
                'contact.health_guarantee': 'Bitki Sağlamlıq Zəmanəti:',
                'contact.health_guarantee_desc': 'Çatdırılan bütün bitkilər üçün 7 günlük zəmanət',

                // Shop page
                'shop.title': 'Bitki Kolleksiyası',
                'shop.subtitle': 'Məkanınız üçün mükəmməl bitkiləri kəşf edin',
                'shop.search_placeholder': 'Bitki axtar...',
                'shop.all_categories': 'Bütün Kateqoriyalar',
                'shop.all_prices': 'Bütün Qiymətlər',
                'shop.featured': 'Seçilmiş',
                'shop.name_az': 'Ad A-Z',
                'shop.price_low_high': 'Qiymət: Aşağıdan Yuxarıya',
                'shop.price_high_low': 'Qiymət: Yuxarıdan Aşağıya',
                'shop.newest_first': 'Əvvəlcə Ən Yenilər',
                'shop.category_label': 'Kateqoriya:',
                'shop.price_label': 'Qiymət Aralığı:',
                'shop.sort_label': 'Sırala:',
                'shop.price_0_25': '$0 - $25',
                'shop.price_25_50': '$25 - $50',
                'shop.price_50_100': '$50 - $100',
                'shop.price_100_plus': '$100+',
                'shop.show_filters': 'Filterləri Göstər',
                'shop.clear_filters': 'Filterləri Təmizlə',
                'shop.grid_view': 'Şəbəkə Görünüşü',
                'shop.list_view': 'Siyahı Görünüşü',
                'shop.showing_results': '{total} bitkidən {start}-{end} arası göstərilir',
                'shop.no_plants_found': 'Bitki tapılmadı',
                'shop.no_plants_desc': 'Daha çox bitki tapmaq üçün axtarış və ya filterlərinizdə dəyişiklik etməyi sınayın.',
                'shop.clear_all_filters': 'Bütün Filterləri Təmizlə',
                'shop.newsletter_title': 'Güncel Qalın',
                'shop.newsletter_subtitle': 'Yeni bitkilər, baxım məsləhətləri və xüsusi təkliflərdən xəbərdar olun',
                'shop.newsletter_placeholder': 'E-poçt ünvanınızı daxil edin',
                'shop.subscribe': 'Abunə Ol',

                // Product
                'product.view_details': 'Təfərrüatları Gör',
                'product.add_to_cart': 'Səbətə Əlavə Et',
                'product.out_of_stock': 'Stokda Yoxdur',
                'product.in_stock': 'stokda',
                'product.sale': 'Endirim!',
                'product.featured': '⭐ Seçilmiş',
                'product.related_title': 'Əlaqəli Bitkilər',
                'product.related_subtitle': 'Bunları da bəyənə bilərsiniz',

                // Cart
                'cart.title': 'Alış-Veriş Səbəti',
                'cart.items': 'məhsul',
                'cart.empty': 'Səbətiniz boşdur',
                'cart.empty_desc': 'Deyəsən hələ heç bir bitki əlavə etməmisiniz.',
                'cart.continue_shopping': 'Alış-Verişə Davam Et',
                'cart.item': 'Məhsul',
                'cart.quantity': 'Miqdar',
                'cart.price': 'Qiymət',
                'cart.total': 'Cəmi',
                'cart.remove': 'Sil',
                'cart.update': 'Yenilə',
                'cart.subtotal': 'Ara Cəmi',
                'cart.delivery': 'Çatdırılma',
                'cart.free': 'Pulsuz',
                'cart.proceed_checkout': 'Ödənişə Keç',
                'cart.recommended_title': 'Bunları da Bəyənə Bilərsiniz',
                'cart.recommended_subtitle': 'Bağınızı bu gözəl bitkilərlə tamamlayın',
                'cart.order_summary': 'Sifariş Xülasəsi',
                'cart.delivery_options': 'Çatdırılma Seçimləri',
                'cart.free_delivery': 'Pulsuz Çatdırılma',
                'cart.free_delivery_desc': '5-7 iş günü',
                'cart.express_delivery': 'Sürətli Çatdırılma',
                'cart.express_delivery_desc': '2-3 iş günü',
                'cart.same_day_delivery': 'Eyni Gün Çatdırılma',
                'cart.same_day_desc': 'Saat 14:00-a qədər sifariş verin',
                'cart.quantity_updated': 'Miqdar yeniləndi',
                'cart.stock_limit': 'Stok limitə çatdı',
                'cart.item_removed': 'Məhsul səbətdən çıxarıldı',
                'cart.delivery_updated': 'Çatdırılma seçimi yeniləndi',
                'cart.empty_checkout': 'Səbətiniz boşdur',

                // Checkout
                'checkout.title': 'Ödəniş',
                'checkout.customer_info': 'Müştəri Məlumatları',
                'checkout.full_name': 'Ad Soyad',
                'checkout.email': 'E-poçt Ünvanı',
                'checkout.phone': 'Telefon Nömrəsi',
                'checkout.delivery_info': 'Çatdırılma Məlumatları',
                'checkout.delivery_type': 'Çatdırılma Növü',
                'checkout.home_delivery': 'Ev Çatdırılması',
                'checkout.store_pickup': 'Mağazadan Götürmə',
                'checkout.delivery_address': 'Çatdırılma Ünvanı',
                'checkout.order_notes': 'Sifariş Qeydləri (İstəyə görə)',
                'checkout.order_summary': 'Sifariş Xülasəsi',
                'checkout.place_order': 'Sifariş Ver',
                'checkout.cart': 'Səbət',
                'checkout.information': 'Məlumatlar',
                'checkout.confirmation': 'Təsdiq',
                'checkout.secure_payment': 'Təhlükəsiz Ödəniş',
                'checkout.secure_payment_desc': 'Məlumatlarınız SSL şifrələmə ilə qorunur',
                'checkout.fast_delivery': 'Sürətli Çatdırılma',
                'checkout.fast_delivery_desc': 'Yerli sifarişlər üçün eyni gün çatdırılma mövcuddur',
                'checkout.plant_guarantee': 'Bitki Zəmanəti',
                'checkout.plant_guarantee_desc': '7 günlük sağlam bitki zəmanəti',
                'checkout.support': '7/24 Dəstək',
                'checkout.support_desc': 'Mütəxəssis bitki baxım məsləhətləri',
                'checkout.order_success': 'Sifarişiniz Uğurla Qəbul Edildi!',
                'checkout.order_number': 'Sifariş Nömrəsi',
                'checkout.confirmation_email': 'Təsdiq e-poçtu ünvanınıza göndərildi.',
                'checkout.preferred_language': 'Üstünlük Verilən Dil',
                'checkout.additional_info': 'Əlavə Məlumat',
                'checkout.empty_desc': 'Ödənişə keçməzdən əvvəl səbətinizə bitkilər əlavə edin.',
                'checkout.pickup_desc': 'Mağazamızdan götürün - 2 saat ərzində hazır',
                'checkout.notes_placeholder': 'Çatdırılma üçün xüsusi təlimatlar, bitki baxım istəkləri və s.',
                'checkout.name_required': 'Ad soyad tələb olunur',
                'checkout.name_min_length': 'Ad soyad ən azı 2 simvol olmalıdır',
                'checkout.name_invalid': 'Zəhmət olmasa düzgün ad soyad daxil edin',
                'checkout.email_required': 'E-poçt tələb olunur',
                'checkout.email_invalid': 'Zəhmət olmasa düzgün e-poçt ünvanı daxil edin',
                'checkout.phone_required': 'Telefon nömrəsi tələb olunur',
                'checkout.phone_invalid': 'Zəhmət olmasa düzgün telefon nömrəsi daxil edin',
                'checkout.phone_min_length': 'Telefon nömrəsi ən azı 10 rəqəm olmalıdır',
                'checkout.address_required': 'Ünvan tələb olunur',
                'checkout.address_min_length': 'Ünvan ən azı 10 simvol olmalıdır',

                // Categories
                'category.indoor_plants': 'Daxili Bitkilər',
                'category.indoor_plants_desc': 'Evinizin daxili hissəsi üçün mükəmməl bitkilər',
                'category.outdoor_plants': 'Xarici Bitkilər',
                'category.outdoor_plants_desc': 'Bağ və veranda üçün gözəl bitkilər',
                'category.flowering_plants': 'Çiçəkli Bitkilər',
                'category.flowering_plants_desc': 'Rəngli çiçək açan bitkilər',
                'category.succulents': 'Sukkulent Bitkilər',
                'category.succulents_desc': 'Az baxım tələb edən su saxlayan bitkilər',
                'category.herbs_vegetables': 'Otlar və Tərəvəzlər',
                'category.herbs_vegetables_desc': 'Öz təzə otlarınızı və tərəvəzlərinizi yetişdirin',
                'category.trees_shrubs': 'Ağac və Kollar',
                'category.trees_shrubs_desc': 'Peyzaj üçün böyük bitkilər',

                // Common
                'common.loading': 'Yüklənir...',
                'common.error': 'Nəsə yanlış getdi. Zəhmət olmasa yenidən cəhd edin.',
                'common.try_again': 'Yenidən Cəhd Et',
                'common.close': 'Bağla',
                'common.save': 'Yadda saxla',
                'common.cancel': 'Ləğv et',
                'common.delete': 'Sil',
                'common.edit': 'Redaktə et',
                'common.add': 'Əlavə et',
                'common.search': 'Axtar',
                'common.filter': 'Filtrlə',
                'common.sort': 'Sırala',
                'common.clear': 'Təmizlə',
                'common.next': 'Növbəti',
                'common.previous': 'Əvvəlki',
                'common.page': 'Səhifə',
                'common.of': 'of',

                // Footer
                'footer.tagline': 'Təbiətin gözəlliyini qapınıza gətirməkdə etibarlı partnyorunuz. Keyfiyyətli bitkilər, mütəxəssis baxım, müstəsna xidmət.',
                'footer.quick_links': 'Sürətli Bağlantılar',
                'footer.customer_care': 'Müştəri Xidməti',
                'footer.plant_care_guide': 'Bitki Baxım Bələdçisi',
                'footer.delivery_info': 'Çatdırılma Məlumatları',
                'footer.return_policy': 'Qaytarma Siyasəti',
                'footer.contact_support': 'Dəstək Əlaqəsi',
                'footer.connect': 'Bizimlə Əlaqə Qurun',
                'footer.connect_desc': 'Bitki baxım məsləhətləri, yeni gələnlər və mövsümi xüsusi təkliflər üçün bizi izləyin!',
                'footer.copyright': '© 2025 Hayat Flora. Bütün hüquqlar qorunur.',

                // Language
                'lang.english': 'English',
                'lang.turkish': 'Türkçe',
                'lang.azerbaijani': 'Azərbaycanca',
                'lang.russian': 'Русский'
            },
            
            // Russian
            ru: {
                // Navigation
                'nav.home': 'Главная',
                'nav.featured': 'Рекомендуемые',
                'nav.categories': 'Категории',
                'nav.shop': 'Магазин',
                'nav.about': 'О нас',
                'nav.contact': 'Контакты',
                'nav.track_order': 'Отслеживание заказа',
                
                // Order Tracking
                'track.title': 'Отслеживание заказа',
                'track.subtitle': 'Проверьте статус вашего заказа, введя номер заказа',
                'track.form_title': 'Отследить ваш заказ',
                'track.form_description': 'Просмотрите статус в реальном времени, введя номер заказа',
                'track.order_number_label': 'Номер заказа',
                'track.order_number_placeholder': 'ORD-XXXXX-XXXXX',
                'track.order_number_help': 'Номер вашего заказа был отправлен по электронной почте',
                'track.track_button': 'Отследить заказ',
                'track.error_title': 'Заказ не найден',
                'track.error_message': 'Заказ с введенным номером не найден. Пожалуйста, проверьте номер и попробуйте снова.',
                'track.error_empty': 'Пожалуйста, введите номер заказа',
                'track.info_1_title': 'Статус заказа',
                'track.info_1_desc': 'Отслеживайте ваш заказ через этапы подготовки, доставки и получения',
                'track.info_2_title': 'Email уведомления',
                'track.info_2_desc': 'Изменения статуса вашего заказа уведомляются по электронной почте',
                'track.info_3_title': 'Поддержка клиентов',
                'track.info_3_desc': 'Свяжитесь с нами по вашим вопросам',
                'track.order_number': 'Номер заказа',
                'track.order_date': 'Дата заказа',
                'track.order_status': 'Статус заказа',
                'track.order_items': 'Товары заказа',
                'track.quantity': 'Количество',
                'track.delivery_info': 'Информация о доставке',
                'track.delivery_type': 'Тип доставки',
                'track.home_delivery': 'Доставка на дом',
                'track.store_pickup': 'Самовывоз из магазина',
                'track.delivery_address': 'Адрес доставки',
                'track.payment_summary': 'Сводка платежа',
                'track.subtotal': 'Промежуточный итог',
                'track.delivery_fee': 'Стоимость доставки',
                'track.total': 'Итого',
                
                // Order Status
                'status.pending': 'В ожидании',
                'status.pending_desc': 'Ваш заказ получен и ожидает подтверждения',
                'status.confirmed': 'Подтвержден',
                'status.confirmed_desc': 'Ваш заказ подтвержден и готовится',
                'status.preparing': 'Готовится',
                'status.preparing_desc': 'Ваши прекрасные растения тщательно готовятся',
                'status.ready': 'Готов',
                'status.ready_desc': 'Ваш заказ готов к доставке или самовывозу',
                'status.delivered': 'Доставлен',
                'status.delivered_desc': 'Ваш заказ успешно доставлен',
                'status.cancelled': 'Отменен',
                'status.cancelled_desc': 'Ваш заказ был отменен',
                
                // Homepage
                'hero.title': 'Где природа встречается с красотой',
                'hero.subtitle': 'Откройте для себя нашу чарующую коллекцию растений и цветов',
                
                // About section
                'about.title': 'О Hayat Flora',
                'about.description1': 'Добро пожаловать в наш волшебный мир цветов и растений.',
                'about.description2': 'С многолетним опытом в садоводстве мы тщательно отбираем каждое растение.',
                'about.explore_collection': 'Изучить коллекцию',
                
                // Featured section
                'featured.title': 'Рекомендуемые растения',
                'featured.subtitle': 'Тщательно отобранные фавориты для вашего пространства',
                
                // Categories
                'categories.title': 'Категории растений',
                'categories.subtitle': 'Изучите наш разнообразный ассортимент по типам растений',
                
                // Features
                'features.expert_care': 'Экспертный уход',
                'features.expert_care_desc': 'Подробные инструкции по уходу за каждым растением',
                'features.fast_delivery': 'Быстрая доставка',
                'features.fast_delivery_desc': 'Доставка в тот же день для местных заказов',
                'features.healthy_guarantee': 'Гарантия здоровья',
                'features.healthy_guarantee_desc': 'Все растения гарантированно здоровые и процветающие',
                
                // Contact
                'contact.title': 'Посетите наш магазин',
                'contact.subtitle': 'Увидьте наши растения лично и получите экспертные советы',
                'contact.store_info': 'Информация о магазине',
                'contact.address': 'Адрес:',
                'contact.phone': 'Телефон:',
                'contact.email': 'Электронная почта:',
                'contact.hours': 'Часы работы:',
                'contact.delivery_info': 'Информация о доставке',
                'contact.free_delivery': 'Бесплатная доставка:',
                'contact.free_delivery_desc': 'Бесплатная доставка по центру города Бурса',
                'contact.same_day': 'Доставка в тот же день:',
                'contact.same_day_desc': 'Доступна для заказов до 14:00',
                'contact.care_package': 'Пакет ухода за растениями:',
                'contact.care_package_desc': 'Каждая доставка включает инструкции по уходу',
                'contact.health_guarantee': 'Гарантия здоровья растений:',
                'contact.health_guarantee_desc': '7-дневная гарантия на все доставленные растения',
                
                // Shop page
                'shop.title': 'Коллекция растений',
                'shop.subtitle': 'Найдите идеальные растения для вашего пространства',
                'shop.search_placeholder': 'Поиск растений...',
                'shop.all_categories': 'Все категории',
                'shop.all_prices': 'Все цены',
                'shop.featured': 'Рекомендуемые',
                'shop.name_az': 'Название А-Я',
                'shop.price_low_high': 'Цена: по возрастанию',
                'shop.price_high_low': 'Цена: по убыванию',
                'shop.newest_first': 'Сначала новые',
                'shop.category_label': 'Категория:',
                'shop.price_label': 'Диапазон цен:',
                'shop.sort_label': 'Сортировать:',
                'shop.price_0_25': '$0 - $25',
                'shop.price_25_50': '$25 - $50',
                'shop.price_50_100': '$50 - $100',
                'shop.price_100_plus': '$100+',
                'shop.show_filters': 'Показать фильтры',
                'shop.clear_filters': 'Очистить фильтры',
                'shop.grid_view': 'Сетка',
                'shop.list_view': 'Список',
                'shop.no_plants_found': 'Растения не найдены',
                'shop.no_plants_desc': 'Попробуйте изменить поиск или фильтры, чтобы найти больше растений.',
                'shop.clear_all_filters': 'Очистить все фильтры',
                'shop.subscribed': 'Подписан!',
                
                // Product
                'product.add_to_cart': 'Добавить в корзину',
                'product.out_of_stock': 'Нет в наличии',
                'product.in_stock': 'в наличии',
                'product.view_details': 'Подробнее',
                'product.featured': 'Рекомендуемое',
                'product.sale': 'Скидка!',
                'product.related_title': 'Похожие растения',
                'product.related_subtitle': 'Вам также могут понравиться эти растения',
                
                // Cart
                'cart.title': 'Корзина',
                'cart.items': 'товаров',
                'cart.empty': 'Ваша корзина пуста',
                'cart.empty_desc': 'Похоже, вы еще не добавили ни одного растения.',
                'cart.continue_shopping': 'Продолжить покупки',
                'cart.item': 'Товар',
                'cart.quantity': 'Количество',
                'cart.price': 'Цена',
                'cart.total': 'Итого',
                'cart.remove': 'Удалить',
                'cart.update': 'Обновить',
                'cart.subtotal': 'Подытог',
                'cart.delivery': 'Доставка',
                'cart.free': 'Бесплатно',
                'cart.proceed_checkout': 'Оформить заказ',
                'cart.recommended_title': 'Вам также может понравиться',
                'cart.recommended_subtitle': 'Дополните ваш сад этими прекрасными растениями',
                'cart.order_summary': 'Итог заказа',
                'cart.delivery_options': 'Варианты доставки',
                'cart.free_delivery': 'Бесплатная доставка',
                'cart.free_delivery_desc': '5-7 рабочих дней',
                'cart.express_delivery': 'Экспресс-доставка',
                'cart.express_delivery_desc': '2-3 рабочих дня',
                'cart.same_day_delivery': 'Доставка в тот же день',
                'cart.same_day_desc': 'Закажите до 14:00',
                'cart.quantity_updated': 'Количество обновлено',
                'cart.stock_limit': 'Достигнут лимит склада',
                'cart.item_removed': 'Товар удален из корзины',
                'cart.delivery_updated': 'Способ доставки обновлен',
                'cart.empty_checkout': 'Ваша корзина пуста',
                
                // Checkout
                'checkout.title': 'Оформление заказа',
                'checkout.customer_info': 'Информация о клиенте',
                'checkout.full_name': 'Полное имя',
                'checkout.email': 'Электронная почта',
                'checkout.phone': 'Номер телефона',
                'checkout.delivery_info': 'Информация о доставке',
                'checkout.delivery_type': 'Тип доставки',
                'checkout.home_delivery': 'Доставка на дом',
                'checkout.store_pickup': 'Самовывоз из магазина',
                'checkout.delivery_address': 'Адрес доставки',
                'checkout.order_notes': 'Примечания к заказу (необязательно)',
                'checkout.order_summary': 'Итог заказа',
                'checkout.place_order': 'Оформить заказ',
                'checkout.cart': 'Корзина',
                'checkout.information': 'Информация',
                'checkout.confirmation': 'Подтверждение',
                'checkout.secure_payment': 'Безопасная оплата',
                'checkout.secure_payment_desc': 'Ваша информация защищена SSL-шифрованием',
                'checkout.fast_delivery': 'Быстрая доставка',
                'checkout.fast_delivery_desc': 'Доставка в тот же день для местных заказов',
                'checkout.plant_guarantee': 'Гарантия на растения',
                'checkout.plant_guarantee_desc': '7-дневная гарантия здоровых растений',
                'checkout.support': 'Поддержка 24/7',
                'checkout.support_desc': 'Экспертные советы по уходу за растениями',
                'checkout.order_success': 'Заказ успешно оформлен!',
                'checkout.order_number': 'Номер заказа',
                'checkout.confirmation_email': 'Подтверждение отправлено на ваш адрес электронной почты.',
                'checkout.preferred_language': 'Предпочитаемый язык',
                'checkout.additional_info': 'Дополнительная информация',
                'checkout.empty_desc': 'Добавьте растения в корзину перед оформлением заказа.',
                'checkout.pickup_desc': 'Заберите из нашего магазина - Готово через 2 часа',
                'checkout.notes_placeholder': 'Специальные инструкции для доставки, запросы по уходу за растениями и т.д.',
                'checkout.name_required': 'Имя обязательно',
                'checkout.name_min_length': 'Имя должно содержать не менее 2 символов',
                'checkout.name_invalid': 'Пожалуйста, введите корректное имя',
                'checkout.email_required': 'Электронная почта обязательна',
                'checkout.email_invalid': 'Пожалуйста, введите корректный адрес электронной почты',
                'checkout.phone_required': 'Номер телефона обязателен',
                'checkout.phone_invalid': 'Пожалуйста, введите корректный номер телефона',
                'checkout.phone_min_length': 'Номер телефона должен содержать не менее 10 цифр',
                'checkout.address_required': 'Адрес обязателен',
                'checkout.address_min_length': 'Адрес должен содержать не менее 10 символов',
                
                // Categories
                'category.indoor_plants': 'Комнатные растения',
                'category.indoor_plants_desc': 'Идеальные растения для дома',
                'category.outdoor_plants': 'Уличные растения',
                'category.outdoor_plants_desc': 'Выносливые растения для сада',
                'category.flowering_plants': 'Цветущие растения',
                'category.flowering_plants_desc': 'Красочные цветущие растения',
                'category.succulents': 'Суккуленты',
                'category.succulents_desc': 'Неприхотливые растения',
                'category.herbs_vegetables': 'Травы и овощи',
                'category.herbs_vegetables_desc': 'Выращивайте свои свежие травы и овощи',
                'category.trees_shrubs': 'Деревья и кустарники',
                'category.trees_shrubs_desc': 'Крупные растения для ландшафта',
                
                // Common
                'common.loading': 'Загрузка...',
                'common.error': 'Что-то пошло не так. Попробуйте снова.',
                'common.try_again': 'Попробовать снова',
                'common.close': 'Закрыть',
                'common.save': 'Сохранить',
                'common.cancel': 'Отмена',
                'common.delete': 'Удалить',
                'common.edit': 'Редактировать',
                'common.add': 'Добавить',
                'common.search': 'Поиск',
                'common.filter': 'Фильтр',
                'common.sort': 'Сортировать',
                'common.clear': 'Очистить',
                
                // Footer
                'footer.tagline': 'Ваш надежный партнер в доставке красоты природы',
                'footer.quick_links': 'Быстрые ссылки',
                'footer.customer_care': 'Обслуживание клиентов',
                'footer.connect': 'Связаться с нами',
                'footer.connect_desc': 'Следите за советами по уходу за растениями и новинками!',
                'footer.copyright': '© 2025 Hayat Flora. Все права защищены.',
                
                // Language
                'lang.english': 'English',
                'lang.turkish': 'Türkçe',
                'lang.azerbaijani': 'Azərbaycanca',
                'lang.russian': 'Русский'
            }
        };
    }

    setupLanguageSwitcher() {
        // Create language switcher
        const languageSwitcher = document.createElement('div');
        languageSwitcher.className = 'language-switcher';
        languageSwitcher.innerHTML = `
            <div class="language-dropdown">
                <button class="language-btn" id="languageBtn">
                    <span class="language-text">${this.getLanguageText()}</span>
                    <span class="language-arrow">▼</span>
                </button>
                <div class="language-options" id="languageOptions">
                    <div class="language-option ${this.currentLanguage === 'en' ? 'active' : ''}" data-lang="en">
                        <span class="flag">🇺🇸</span>
                        <span class="text">${this.t('lang.english')}</span>
                    </div>
                    <div class="language-option ${this.currentLanguage === 'tr' ? 'active' : ''}" data-lang="tr">
                        <span class="flag">🇹🇷</span>
                        <span class="text">${this.t('lang.turkish')}</span>
                    </div>
                    <div class="language-option ${this.currentLanguage === 'az' ? 'active' : ''}" data-lang="az">
                        <span class="flag">🇦🇿</span>
                        <span class="text">${this.t('lang.azerbaijani')}</span>
                    </div>
                </div>
            </div>
        `;

        // Add to header
        const navContainer = document.querySelector('.nav-container');
        if (navContainer) {
            navContainer.appendChild(languageSwitcher);
        }

        // Add styles
        this.addLanguageSwitcherStyles();

        // Add event listeners
        this.setupLanguageSwitcherEvents();
    }

    addLanguageSwitcherStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .language-switcher {
                position: relative;
                margin-left: 1rem;
            }

            .language-dropdown {
                position: relative;
            }

            .language-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: transparent;
                border: 2px solid #2d5a27;
                padding: 0.5rem 1rem;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #2d5a27;
                font-weight: 500;
            }

            .language-btn:hover {
                background: #2d5a27;
                color: white;
            }

            .language-arrow {
                transition: transform 0.3s ease;
                font-size: 0.8rem;
            }

            .language-dropdown.open .language-arrow {
                transform: rotate(180deg);
            }

            .language-options {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                min-width: 180px;
                z-index: 1000;
                margin-top: 0.5rem;
            }

            .language-dropdown.open .language-options {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .language-option {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                cursor: pointer;
                transition: background-color 0.2s ease;
                border-bottom: 1px solid #f0f0f0;
            }

            .language-option:last-child {
                border-bottom: none;
            }

            .language-option:hover {
                background-color: #f8f9fa;
            }

            .language-option.active {
                background-color: #2d5a27;
                color: white;
            }

            .language-option .flag {
                font-size: 1.2rem;
            }

            .language-option .text {
                font-weight: 500;
            }

            @media (max-width: 768px) {
                .language-switcher {
                    margin: 0;
                    order: -1;
                }

                .language-options {
                    right: auto;
                    left: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupLanguageSwitcherEvents() {
        const languageBtn = document.getElementById('languageBtn');
        const languageOptions = document.getElementById('languageOptions');
        const dropdown = languageBtn?.parentElement;

        if (languageBtn && languageOptions && dropdown) {
            languageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });

            languageOptions.addEventListener('click', (e) => {
                const option = e.target.closest('.language-option');
                if (option) {
                    const lang = option.dataset.lang;
                    if (lang) {
                        this.setLanguage(lang);
                        dropdown.classList.remove('open');
                    }
                }
            });

            document.addEventListener('click', () => {
                dropdown.classList.remove('open');
            });
        }
    }

    getLanguageText() {
        const flags = { en: '🇺🇸', tr: '🇹🇷', az: '🇦🇿' };
        const names = { en: 'EN', tr: 'TR', az: 'AZ' };
        return `${flags[this.currentLanguage]} ${names[this.currentLanguage]}`;
    }

    updateLanguageSwitcher() {
        const languageText = document.querySelector('.language-text');
        if (languageText) {
            languageText.textContent = this.getLanguageText();
        }

        const options = document.querySelectorAll('.language-option');
        options.forEach(option => {
            option.classList.toggle('active', option.dataset.lang === this.currentLanguage);
        });
    }

    t(key, params = {}) {
        const translation = this.translations[this.currentLanguage]?.[key] || 
                          this.translations['en']?.[key] || 
                          key;
        
        // Replace parameters
        return translation.replace(/\{(\w+)\}/g, (match, param) => {
            return params[param] || match;
        });
    }

    applyTranslations() {
        // Find all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.placeholder !== undefined) {
                    element.placeholder = translation;
                } else {
                    element.value = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // Find all elements with data-i18n-placeholder attribute
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Find all elements with data-i18n-title attribute
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Find all elements with data-i18n-html attribute
        const htmlElements = document.querySelectorAll('[data-i18n-html]');
        htmlElements.forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            element.innerHTML = this.t(key);
        });

        // Update page title
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = this.t(titleKey);
        }

        // Update document direction for RTL languages (if needed in future)
        document.documentElement.lang = this.currentLanguage;
    }
}

// Initialize i18n system
const i18n = new I18nManager();

// Export for global use
window.i18n = i18n;
window.t = (key, params) => i18n.t(key, params);