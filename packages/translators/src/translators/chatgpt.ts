import { PronunciationSpeed, TranslationResult } from "../types";
import axios from "../axios";
/**
 * Supported languages.
 */
const LANGUAGES: [string, string][] = [
    ["auto", "auto"],
    ["bg", "bg"],
    ["et", "et"],
    ["pl", "pl"],
    ["da", "da"],
    ["de", "de"],
    ["ru", "ru"],
    ["fr", "fr"],
    ["fi", "fi"],
    ["nl", "nl"],
    ["zh-CN", "zh"],
    ["zh-TW", "zh"],
    ["cs", "cs"],
    ["lv", "lv"],
    ["lt", "lt"],
    ["ro", "ro"],
    ["pt", "pt"],
    ["ja", "ja"],
    ["sv", "sv"],
    ["sk", "sk"],
    ["sl", "sl"],
    ["es", "es"],
    ["el", "el"],
    ["hu", "hu"],
    ["it", "it"],
    ["en", "en"],
];

/**
 * ChatGPT translator interface.
 */
class ChatGPTTranslator {

    API_URL = '/v1/chat/completions';
    /**
     * Language to translator language code.
     */
    LAN_TO_CODE = new Map(LANGUAGES);

    /**
     * Translator language code to language.
     */
    CODE_TO_LAN = new Map(LANGUAGES.map(([lan, code]) => [code, lan]));
    langDetector: any;
    TTSEngine: any;


    constructor(langDetector: any, TTSEngine: any) {
        /**
         * ChatGPT needs help from other translators.
         */
        this.langDetector = langDetector;
        this.TTSEngine = TTSEngine;

    }


    /**
     * Get supported languages of this API.
     *
     * @returns supported languages
     */
    supportedLanguages() {
        return new Set(this.LAN_TO_CODE.keys());
    }

    /**
     * Detect language of given text.
     *
     * @param text text to detect
     *
     * @returns detected language Promise
     */
    async detect(text: string) {
        return await this.langDetector.detect(text);
    }

    getStorageValuePromise(key: string) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(key, resolve);
        });
    }

    /**
     * Translate given text.
     *
     * @param text text to translate
     * @param from source language
     * @param to target language
     *
     * @returns translation Promise
     */
    async translate(text: string, from: string, to: string) {
        try {
            const result: any = await this.getStorageValuePromise("OpenAISettings");

            let ChatGPTKey = result.OpenAISettings["ChatGPTKey"];
            let OpenAIURL = result.OpenAISettings["OpenAIURL"];
            let ModelName = result.OpenAISettings["ModelName"];

            if (ModelName === undefined || ModelName === "" || ModelName === null) {
                ModelName = 'gpt-3.5-turbo';
            }

            console.log("ChatGPTKey", ChatGPTKey);

            const response = await axios.post(OpenAIURL + this.API_URL, {
                "messages": [{ "role": "user", "content": `Translate "${text}" from ${from} to ${to}:` }],
                max_tokens: 3000,
                temperature: 0.7,
                n: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                model: ModelName,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ChatGPTKey}`,
                },
            });
            const translation = (response.data as any).choices[0].message.content.trim();
            return { mainMeaning: translation, originalText: text } as TranslationResult;
        } catch (error: any) {
            error.errorCode = error.status || 0;
            error.errorMsg = error.errorMsg || error.message;
            error.errorAct = {
                api: "ChatGPT",
                action: "translate",
                text,
                from,
                to,
            };
            throw error;
        }
    }

    async checkGrammar(text: string, from: string, to: string) {
        try {
            const result: any = await this.getStorageValuePromise("OpenAISettings");

            let ChatGPTKey = result.OpenAISettings["ChatGPTKey"];
            let OpenAIURL = result.OpenAISettings["OpenAIURL"];
            let ModelName = result.OpenAISettings["ModelName"];

            if (ModelName === undefined || ModelName === "" || ModelName === null) {
                ModelName = 'gpt-3.5-turbo';
            }

            console.log("ChatGPTKey", ChatGPTKey);

            const response = await axios.post(OpenAIURL + this.API_URL, {
                "messages": [{ "role": "user", "content": `"Please correct the grammar and polish the following sentences, do not provide any translation, comments, or notes, and use the same language as input:\n\n" "${text}"` }],
                max_tokens: 3000,
                temperature: 0.7,
                n: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                model: ModelName,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ChatGPTKey}`,
                },
            });
            const translation = (response.data as any).choices[0].message.content.trim();
            return { mainMeaning: translation, originalText: text } as TranslationResult;
        } catch (error: any) {
            error.errorCode = error.status || 0;
            error.errorMsg = error.errorMsg || error.message;
            error.errorAct = {
                api: "ChatGPT",
                action: "translate",
                text,
                from,
                to,
            };
            throw error;
        }
    }

    /**
     * Pronounce given text.
     *
     * @param text text to pronounce
     * @param language language of text
     * @param speed "fast" or "slow"
     *
     * @returns pronounce finished
     */
    async pronounce(text: string, language: string, speed: PronunciationSpeed) {
        return await this.TTSEngine.pronounce(text, language, speed);
    }

    /**
     * Pause pronounce.
     */
    stopPronounce() {
        this.TTSEngine.stopPronounce();
    }
}

export default ChatGPTTranslator;