import axios from 'axios';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

class GitHubService {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Hina-Bot-V2'
        };
        
        // Only add Authorization header if we have a valid token
        if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'ghp_abcdefghijklmnopqrstuvwxyz1234567890') {
            this.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
            this.hasToken = true;
        } else {
            this.hasToken = false;
            logger.warn('GitHub token not configured. Using unauthenticated requests (rate limited).');
        }
    }

    async getUserProfile(username) {
        try {
            const response = await axios.get(`${this.baseURL}/users/${username}`, {
                headers: this.headers
            });
            
            const user = response.data;
            
            // Get user repositories
            const reposResponse = await axios.get(`${this.baseURL}/users/${username}/repos`, {
                headers: this.headers,
                params: {
                    sort: 'updated',
                    per_page: 5
                }
            });
            
            logger.info(`Retrieved GitHub profile for ${username}`);
            
            return {
                profile: user,
                repositories: reposResponse.data
            };
        } catch (error) {
            logger.error(`Failed to get GitHub profile for ${username}:`, error);
            
            if (error.response?.status === 404) {
                throw new Error(`User "${username}" not found on GitHub`);
            }
            
            if (error.response?.status === 401) {
                throw new Error('GitHub API authentication failed. Please check your token.');
            }
            
            if (error.response?.status === 403) {
                throw new Error('GitHub API rate limit exceeded. Please try again later.');
            }
            
            throw new Error('Failed to fetch GitHub profile');
        }
    }

    async searchRepositories(query, limit = 10) {
        try {
            // Check if we can use search API
            if (!this.hasToken) {
                throw new Error('GitHub token required for repository search. Please configure GITHUB_TOKEN in environment variables.');
            }
            
            const response = await axios.get(`${this.baseURL}/search/repositories`, {
                headers: this.headers,
                params: {
                    q: query,
                    sort: 'stars',
                    order: 'desc',
                    per_page: Math.min(limit, 10)
                }
            });
            
            logger.info(`Search GitHub repositories for query: ${query}`);
            
            return response.data.items;
        } catch (error) {
            logger.error(`Failed to search GitHub repositories:`, error);
            
            if (error.response?.status === 401) {
                throw new Error('GitHub API authentication failed. Please check your token.');
            }
            
            if (error.response?.status === 403) {
                throw new Error('GitHub API rate limit exceeded. Please try again later.');
            }
            
            if (error.response?.status === 422) {
                throw new Error('Invalid search query. Please try a different search term.');
            }
            
            throw new Error(`Failed to search repositories: ${error.message}`);
        }
    }

    async getRepository(owner, repo) {
        try {
            const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, {
                headers: this.headers
            });
            
            const repository = response.data;
            
            // Get latest releases
            let releases = [];
            try {
                const releasesResponse = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/releases`, {
                    headers: this.headers,
                    params: { per_page: 3 }
                });
                releases = releasesResponse.data;
            } catch (releaseError) {
                // Releases might not be available
                logger.warn(`No releases found for ${owner}/${repo}`);
            }
            
            // Get languages
            let languages = {};
            try {
                const languagesResponse = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/languages`, {
                    headers: this.headers
                });
                languages = languagesResponse.data;
            } catch (langError) {
                logger.warn(`Failed to get languages for ${owner}/${repo}`);
            }
            
            // Get contributors
            let contributors = [];
            try {
                const contributorsResponse = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contributors`, {
                    headers: this.headers,
                    params: { per_page: 5 }
                });
                contributors = contributorsResponse.data;
            } catch (contribError) {
                logger.warn(`Failed to get contributors for ${owner}/${repo}`);
            }
            
            logger.info(`Retrieved GitHub repository ${owner}/${repo}`);
            
            return {
                repository,
                releases,
                languages,
                contributors
            };
        } catch (error) {
            logger.error(`Failed to get GitHub repository ${owner}/${repo}:`, error);
            
            if (error.response?.status === 404) {
                throw new Error(`Repository "${owner}/${repo}" not found on GitHub`);
            }
            
            if (error.response?.status === 401) {
                throw new Error('GitHub API authentication failed. Please check your token.');
            }
            
            if (error.response?.status === 403) {
                throw new Error('GitHub API rate limit exceeded or repository is private.');
            }
            
            throw new Error(`Failed to fetch repository: ${error.message}`);
        }
    }

    async getUserRepositories(username, limit = 10) {
        try {
            const response = await axios.get(`${this.baseURL}/users/${username}/repos`, {
                headers: this.headers,
                params: {
                    sort: 'updated',
                    per_page: Math.min(limit, 30)
                }
            });
            
            logger.info(`Retrieved repositories for user ${username}`);
            
            return response.data;
        } catch (error) {
            logger.error(`Failed to get repositories for user ${username}:`, error);
            
            if (error.response?.status === 404) {
                throw new Error(`User "${username}" not found on GitHub`);
            }
            
            if (error.response?.status === 401) {
                throw new Error('GitHub API authentication failed. Please check your token.');
            }
            
            if (error.response?.status === 403) {
                throw new Error('GitHub API rate limit exceeded. Please try again later.');
            }
            
            throw new Error('Failed to fetch user repositories');
        }
    }

    formatUserProfile(data) {
        const { profile, repositories } = data;
        
        const formattedProfile = {
            username: profile.login,
            name: profile.name || 'N/A',
            bio: profile.bio || 'No bio available',
            avatarUrl: profile.avatar_url,
            htmlUrl: profile.html_url,
            followers: profile.followers || 0,
            following: profile.following || 0,
            publicRepos: profile.public_repos || 0,
            createdAt: profile.created_at,
            location: profile.location || 'Unknown',
            blog: profile.blog || null
        };

        const formattedRepositories = repositories.map(repo => ({
            name: repo.name,
            description: repo.description || 'No description',
            htmlUrl: repo.html_url,
            language: repo.language || 'Unknown',
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            updatedAt: repo.updated_at,
            isPrivate: repo.private
        }));

        return {
            profile: formattedProfile,
            repositories: formattedRepositories
        };
    }

    formatRepository(data) {
        const { repository, releases, languages, contributors } = data;
        
        const formattedRepo = {
            name: repository.name,
            fullName: repository.full_name,
            description: repository.description || 'No description',
            htmlUrl: repository.html_url,
            cloneUrl: repository.clone_url,
            stars: repository.stargazers_count || 0,
            forks: repository.forks_count || 0,
            watchers: repository.watchers_count || 0,
            openIssues: repository.open_issues_count || 0,
            language: repository.language || 'Unknown',
            createdAt: repository.created_at,
            updatedAt: repository.updated_at,
            isPrivate: repository.private,
            hasWiki: repository.has_wiki,
            hasPages: repository.has_pages,
            license: repository.license?.name || 'No license',
            owner: {
                login: repository.owner.login,
                avatarUrl: repository.owner.avatar_url,
                htmlUrl: repository.owner.html_url
            }
        };

        const formattedReleases = releases.map(release => ({
            name: release.name || release.tag_name,
            tagName: release.tag_name,
            body: release.body || 'No description',
            htmlUrl: release.html_url,
            publishedAt: release.published_at,
            isPrerelease: release.prerelease
        }));

        const formattedContributors = contributors.map(contributor => ({
            login: contributor.login,
            avatarUrl: contributor.avatar_url,
            htmlUrl: contributor.html_url,
            contributions: contributor.contributions
        }));

        return {
            repository: formattedRepo,
            releases: formattedReleases,
            languages,
            contributors: formattedContributors
        };
    }

    formatSearchResults(repositories) {
        return repositories.map(repo => ({
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || 'No description',
            htmlUrl: repo.html_url,
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            language: repo.language || 'Unknown',
            updatedAt: repo.updated_at,
            owner: {
                login: repo.owner.login,
                avatarUrl: repo.owner.avatar_url,
                htmlUrl: repo.owner.html_url
            }
        }));
    }
}

export default new GitHubService();