import axios from 'axios';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

class SearchService {
    constructor() {
        this.apiKey = process.env.GOOGLE_SEARCH_API_KEY;
        this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
        this.baseURL = 'https://www.googleapis.com/customsearch/v1';
    }

    async searchWeb(query, options = {}) {
        try {
            const {
                searchType = 'web',
                num = 10,
                start = 1,
                safe = 'medium',
                fileType = null,
                siteSearch = null
            } = options;

            const params = {
                key: this.apiKey,
                cx: this.searchEngineId,
                q: query,
                num: Math.min(num, 10),
                start,
                safe
            };

            // Add specific search parameters
            if (searchType === 'image') {
                params.searchType = 'image';
            }
            
            if (fileType) {
                params.fileType = fileType;
            }
            
            if (siteSearch) {
                params.siteSearch = siteSearch;
            }

            const response = await axios.get(this.baseURL, { params });

            logger.info(`Search completed for query: ${query}`);

            return this.formatSearchResults(response.data, searchType);
        } catch (error) {
            logger.error(`Search failed for query: ${query}`, error);
            
            if (error.response?.status === 429) {
                throw new Error('Search quota exceeded. Please try again later.');
            }
            
            if (error.response?.status === 403) {
                throw new Error('Search API access denied. Please check API key.');
            }
            
            throw new Error('Search failed. Please try again.');
        }
    }

    async searchImages(query, options = {}) {
        return this.searchWeb(query, { 
            ...options, 
            searchType: 'image' 
        });
    }

    async searchNews(query, options = {}) {
        return this.searchWeb(`${query} news`, {
            ...options,
            siteSearch: 'news.google.com OR cnn.com OR bbc.com OR reuters.com'
        });
    }

    async searchVideos(query, options = {}) {
        return this.searchWeb(`${query} site:youtube.com`, options);
    }

    async searchDocuments(query, fileType = 'pdf', options = {}) {
        return this.searchWeb(query, {
            ...options,
            fileType
        });
    }

    formatSearchResults(data, searchType) {
        const results = {
            totalResults: data.searchInformation?.totalResults || '0',
            searchTime: data.searchInformation?.searchTime || '0',
            items: []
        };

        if (!data.items || data.items.length === 0) {
            return results;
        }

        results.items = data.items.map(item => {
            const result = {
                title: item.title || 'No title',
                link: item.link || '',
                snippet: item.snippet || 'No description available',
                displayLink: item.displayLink || '',
                formattedUrl: item.formattedUrl || item.link || ''
            };

            // Add specific fields for different search types
            if (searchType === 'image') {
                result.image = {
                    contextLink: item.image?.contextLink || '',
                    thumbnailLink: item.image?.thumbnailLink || '',
                    width: item.image?.width || 0,
                    height: item.image?.height || 0,
                    byteSize: item.image?.byteSize || 0
                };
            }

            // Add page metadata if available
            if (item.pagemap) {
                if (item.pagemap.cse_thumbnail) {
                    result.thumbnail = {
                        src: item.pagemap.cse_thumbnail[0]?.src || '',
                        width: item.pagemap.cse_thumbnail[0]?.width || 0,
                        height: item.pagemap.cse_thumbnail[0]?.height || 0
                    };
                }

                if (item.pagemap.metatags) {
                    const meta = item.pagemap.metatags[0];
                    result.metadata = {
                        description: meta['og:description'] || meta.description || '',
                        image: meta['og:image'] || '',
                        site_name: meta['og:site_name'] || '',
                        type: meta['og:type'] || ''
                    };
                }
            }

            return result;
        });

        return results;
    }

    createSearchEmbed(results, query, searchType = 'web') {
        const embed = {
            title: `🔍 Search Results for "${query}"`,
            color: 0x4285f4,
            footer: {
                text: `💖 Hina Bot • ${searchType.charAt(0).toUpperCase() + searchType.slice(1)} Search • ${results.totalResults} results in ${results.searchTime}s`
            },
            timestamp: new Date().toISOString(),
            fields: []
        };

        if (results.items.length === 0) {
            embed.description = `Không tìm thấy kết quả nào cho "${query}" 😅\nHãy thử từ khóa khác nhé! 🤔`;
            return embed;
        }

        // Add search results as fields
        results.items.slice(0, 5).forEach((item, index) => {
            let value = item.snippet;
            
            if (value.length > 200) {
                value = value.substring(0, 200) + '...';
            }

            embed.fields.push({
                name: `${index + 1}. ${item.title}`,
                value: `${value}\n[🔗 ${item.displayLink}](${item.link})`,
                inline: false
            });
        });

        // Add thumbnail if available
        if (results.items[0]?.thumbnail?.src) {
            embed.thumbnail = {
                url: results.items[0].thumbnail.src
            };
        }

        return embed;
    }

    createImageSearchEmbed(results, query) {
        const embed = {
            title: `🖼️ Image Search Results for "${query}"`,
            color: 0x4285f4,
            footer: {
                text: `💖 Hina Bot • Image Search • ${results.totalResults} results in ${results.searchTime}s`
            },
            timestamp: new Date().toISOString()
        };

        if (results.items.length === 0) {
            embed.description = `Không tìm thấy hình ảnh nào cho "${query}" 😅\nHãy thử từ khóa khác nhé! 🤔`;
            return embed;
        }

        // Use first image as main image
        const firstImage = results.items[0];
        if (firstImage.image?.thumbnailLink) {
            embed.image = {
                url: firstImage.image.thumbnailLink
            };
        }

        embed.description = `**${firstImage.title}**\n[🔗 View Original](${firstImage.link})`;

        // Add other images as fields
        if (results.items.length > 1) {
            embed.fields = results.items.slice(1, 4).map((item, index) => ({
                name: `Image ${index + 2}`,
                value: `[${item.title}](${item.link})`,
                inline: true
            }));
        }

        return embed;
    }

    getSearchTypeEmoji(searchType) {
        const emojis = {
            'web': '🌐',
            'image': '🖼️',
            'news': '📰',
            'video': '🎥',
            'document': '📄'
        };
        
        return emojis[searchType] || '🔍';
    }

    validateQuery(query) {
        if (!query || query.trim().length === 0) {
            return { valid: false, error: 'Search query cannot be empty' };
        }

        if (query.length > 200) {
            return { valid: false, error: 'Search query too long (max 200 characters)' };
        }

        // Check for potentially harmful queries
        const prohibited = ['xxx', 'porn', 'adult', 'explicit'];
        const lowerQuery = query.toLowerCase();
        
        if (prohibited.some(word => lowerQuery.includes(word))) {
            return { valid: false, error: 'Search query contains prohibited content' };
        }

        return { valid: true };
    }

    async getSearchSuggestions(query) {
        try {
            const response = await axios.get('https://suggestqueries.google.com/complete/search', {
                params: {
                    client: 'firefox',
                    q: query
                }
            });

            if (response.data && response.data[1]) {
                return response.data[1].slice(0, 5);
            }

            return [];
        } catch (error) {
            logger.error('Failed to get search suggestions:', error);
            return [];
        }
    }
}

export default new SearchService();
