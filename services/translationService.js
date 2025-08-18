const { Translate } = require('@google-cloud/translate').v2;
const path = require('path');
const fs = require('fs');

class TranslationService {
    constructor() {
        this.translate = null;
        this.isInitialized = false;
        this.initializeService();
    }

    initializeService() {
        try {
            const credentialsPath = path.join(__dirname, '..', 'hayat-flora-translations-2ff344fe8fda.json');
            
            if (!fs.existsSync(credentialsPath)) {
                console.log('⚠️ Translation credentials file not found. Running in mock mode.');
                this.isInitialized = false;
                return;
            }

            process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
            
            this.translate = new Translate({
                projectId: 'hayat-flora-translations',
                keyFilename: credentialsPath
            });
            
            this.isInitialized = true;
            console.log('✅ Google Translate API initialized successfully');
            console.log('   Project ID: hayat-flora-translations');
            console.log('   Credentials: ' + path.relative(process.cwd(), credentialsPath));
        } catch (error) {
            console.error('❌ Failed to initialize translation service:', error.message);
            this.isInitialized = false;
        }
    }

    async translateText(text, targetLang) {
        if (!text || text.trim() === '') {
            return text;
        }

        if (!this.isInitialized) {
            return this.mockTranslate(text, targetLang);
        }

        try {
            const [translation] = await this.translate.translate(text, targetLang);
            return translation;
        } catch (error) {
            console.error(`Translation error for ${targetLang}:`, error.message);
            return this.mockTranslate(text, targetLang);
        }
    }

    mockTranslate(text, targetLang) {
        // Simple mock translation for development
        const suffix = {
            'en': ' (EN)',
            'az': ' (AZ)',
            'ru': ' (RU)'
        };
        return text + (suffix[targetLang] || '');
    }

    async translateProduct(productData) {
        const translations = {
            name: { en: '', az: '', ru: '' },
            description: { en: '', az: '', ru: '' },
            care_instructions: { en: '', az: '', ru: '' }
        };

        const languages = ['en', 'az', 'ru'];

        for (const lang of languages) {
            if (productData.name) {
                translations.name[lang] = await this.translateText(productData.name, lang);
            }
            if (productData.description) {
                translations.description[lang] = await this.translateText(productData.description, lang);
            }
            if (productData.care_instructions) {
                translations.care_instructions[lang] = await this.translateText(productData.care_instructions, lang);
            }
        }

        return translations;
    }

    async translateCategory(categoryData) {
        const translations = {
            name: { en: '', az: '', ru: '' },
            description: { en: '', az: '', ru: '' }
        };

        const languages = ['en', 'az', 'ru'];

        for (const lang of languages) {
            if (categoryData.name) {
                translations.name[lang] = await this.translateText(categoryData.name, lang);
            }
            if (categoryData.description) {
                translations.description[lang] = await this.translateText(categoryData.description, lang);
            }
        }

        return translations;
    }

    async translatePlantData(plantData) {
        const result = {};
        const languages = ['en', 'az', 'ru'];

        for (const lang of languages) {
            if (plantData.name) {
                result[`name_${lang}`] = await this.translateText(plantData.name, lang);
            }
            if (plantData.description) {
                result[`description_${lang}`] = await this.translateText(plantData.description, lang);
            }
            if (plantData.care_instructions) {
                result[`care_instructions_${lang}`] = await this.translateText(plantData.care_instructions, lang);
            }
        }

        return result;
    }

    async translateCategoryData(categoryData) {
        const result = {};
        const languages = ['en', 'az', 'ru'];

        for (const lang of languages) {
            if (categoryData.name) {
                result[`name_${lang}`] = await this.translateText(categoryData.name, lang);
            }
            if (categoryData.description) {
                result[`description_${lang}`] = await this.translateText(categoryData.description, lang);
            }
        }

        return result;
    }
}

// Create and export singleton instance
const translationService = new TranslationService();
module.exports = translationService;