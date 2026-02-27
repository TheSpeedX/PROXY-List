const axios = require('axios');
const crypto = require('crypto');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { HttpsProxyAgent } = require('https-proxy-agent');

// ========== CONFIGURATION ==========
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ========== COLOR CODES ==========
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m'
};

// ========== TIKTOK ASCII ART ==========
const TIKTOK_ASCII = `
${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║ ████████╗██╗██╗  ██╗████████╗ ██████╗ ██╗  ██╗███████╗     ║
║ ╚══██╔══╝██║██║ ██╔╝╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝     ║
║    ██║   ██║█████╔╝    ██║   ██║   ██║█████╔╝ █████╗       ║
║    ██║   ██║██╔═██╗    ██║   ██║   ██║██╔═██╗ ██╔══╝       ║
║    ██║   ██║██║  ██╗   ██║   ╚██████╔╝██║  ██╗███████╗     ║
║    ╚═╝   ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝     ║
║                                                              ║
║              ${colors.red}▓▓▓ ${colors.white}REPORT BOT v2.0 ${colors.red}▓▓▓${colors.magenta}              ║
║                 ${colors.yellow}• BYPASS SYSTEM •${colors.magenta}                 ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`;

// ========== TIKTOK API ENDPOINTS ==========
const TIKTOK_APIS = {
    REPORT: 'https://www.tiktok.com/api/report/item/',
    USER_DETAIL: 'https://www.tiktok.com/api/user/detail/',
    VIDEO_DETAIL: 'https://www.tiktok.com/api/post/detail/'
};

class TikTokScraper {
    constructor() {
        this.client = axios.create({
            timeout: 10000,
            headers: this.getHeaders()
        });
        this.workingProxies = [];
        this.proxyFiles = ['socks4.txt', 'socks5.txt', 'http.txt'];
    }

    getHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.tiktok.com/',
        };
    }

    // ========== PROXY MANAGEMENT FROM FILES ==========
    
    async loadProxiesFromFiles() {
        let allProxies = [];
        
        for (const file of this.proxyFiles) {
            if (fs.existsSync(file)) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    const proxies = content.split('\n')
                        .map(line => line.trim())
                        .filter(line => line && !line.startsWith('#'))
                        .map(line => {
                            if (file.includes('socks4')) {
                                return `socks4://${line}`;
                            } else if (file.includes('socks5')) {
                                return `socks5://${line}`;
                            } else {
                                return `http://${line}`;
                            }
                        });
                    
                    allProxies = [...allProxies, ...proxies];
                    this.log(`${colors.green}✓${colors.reset} Loaded ${proxies.length} proxies from ${file}`);
                } catch (error) {
                    this.log(`${colors.red}✗${colors.reset} Failed to load ${file}: ${error.message}`);
                }
            } else {
                this.log(`${colors.yellow}!${colors.reset} File not found: ${file}`);
            }
        }

        // Add some fallback proxies
        const fallbackProxies = [
            'http://8.213.128.77:8080',
            'http://103.167.134.31:80',
            'http://45.95.147.106:8080',
            'http://154.236.189.27:1976',
            'http://194.28.84.137:80'
        ];
        
        allProxies = [...allProxies, ...fallbackProxies];
        return [...new Set(allProxies)]; // Remove duplicates
    }

    async testProxy(proxy) {
        try {
            const agent = new HttpsProxyAgent(proxy);
            const response = await axios.get('https://httpbin.org/ip', {
                httpsAgent: agent,
                timeout: 5000
            });
            return response.status === 200;
        } catch {
            return false;
        }
    }

    async initializeProxies() {
        this.log(`${colors.cyan}🔍 LOADING PROXIES FROM FILES...${colors.reset}`);
        
        const allProxies = await this.loadProxiesFromFiles();
        this.workingProxies = [];
        
        this.log(`${colors.cyan}🧪 TESTING ${allProxies.length} PROXIES...${colors.reset}`);
        
        let tested = 0;
        for (const proxy of allProxies) {
            tested++;
            process.stdout.write(`\r${colors.blue}[${tested}/${allProxies.length}]${colors.reset} Testing ${proxy}... `);
            
            const isWorking = await this.testProxy(proxy);
            if (isWorking) {
                process.stdout.write(`${colors.green}WORKING${colors.reset}\n`);
                this.workingProxies.push(proxy);
            } else {
                process.stdout.write(`${colors.red}DEAD${colors.reset}\n`);
            }
        }
        
        this.log(`\n${colors.green}✅ FOUND ${this.workingProxies.length} WORKING PROXIES${colors.reset}`);
        return this.workingProxies;
    }

    getRandomWorkingProxy() {
        if (this.workingProxies.length === 0) {
            return null;
        }
        return this.workingProxies[Math.floor(Math.random() * this.workingProxies.length)];
    }

    // ========== LOGGING WITH STYLE ==========
    
    log(message) {
        console.log(`${colors.white}${message}${colors.reset}`);
    }

    logSuccess(message) {
        console.log(`${colors.green}✅ ${message}${colors.reset}`);
    }

    logError(message) {
        console.log(`${colors.red}❌ ${message}${colors.reset}`);
    }

    logWarning(message) {
        console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
    }

    logInfo(message) {
        console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
    }

    // ========== SCRAPING FUNCTIONS ==========
    
    async scrapeUserProfile(username) {
        try {
            this.logInfo(`Scraping user profile: @${username}`);
            
            // Try without proxy first
            const response = await this.client.get(`https://www.tiktok.com/@${username}`, {
                headers: {
                    ...this.getHeaders(),
                    'Referer': `https://www.tiktok.com/@${username}`
                },
                timeout: 8000
            });

            const dom = new JSDOM(response.data);
            const script = dom.window.document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
            
            if (script) {
                const data = JSON.parse(script.textContent);
                const userData = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user;
                
                if (userData) {
                    return {
                        id: userData.id,
                        uniqueId: userData.uniqueId,
                        nickname: userData.nickname,
                        signature: userData.signature,
                        verified: userData.verified,
                        avatarLarger: userData.avatarLarger,
                        stats: userData.stats
                    };
                }
            }
            
        } catch (error) {
            this.logWarning('Direct scrape failed, trying with proxy...');
        }

        // Fallback to API with proxy
        return await this.getUserInfoAPI(username);
    }

    async getUserInfoAPI(username) {
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const proxy = this.getRandomWorkingProxy();
                const agent = proxy ? new HttpsProxyAgent(proxy) : null;
                
                const params = {
                    uniqueId: username,
                    ...this.generateXSSParams()
                };

                const config = {
                    params,
                    timeout: 8000
                };

                if (agent) {
                    config.httpsAgent = agent;
                }

                const response = await this.client.get(TIKTOK_APIS.USER_DETAIL, config);
                
                if (response.data?.userInfo?.user) {
                    const user = response.data.userInfo.user;
                    return {
                        id: user.id,
                        uniqueId: user.uniqueId,
                        nickname: user.nickname,
                        secUid: user.secUid,
                        signature: user.signature,
                        verified: user.verified,
                        avatarLarger: user.avatarLarger,
                        stats: user.stats
                    };
                }
            } catch (error) {
                this.logError(`API attempt ${attempt} failed: ${error.message}`);
                if (attempt === maxRetries) {
                    return await this.fallbackUserScrape(username);
                }
            }
        }
        return null;
    }

    async fallbackUserScrape(username) {
        try {
            this.logWarning('Using fallback scraping method...');
            
            const response = await this.client.get(`https://www.tiktok.com/@${username}`);
            const html = response.data;
            
            const idMatch = html.match(/"uid":"(\d+)"/) || html.match(/"userId":"(\d+)"/);
            const nicknameMatch = html.match(/"nickname":"([^"]+)"/);
            
            if (idMatch) {
                return {
                    id: idMatch[1],
                    uniqueId: username,
                    nickname: nicknameMatch ? nicknameMatch[1] : username,
                    secUid: `MS4wLjABAAAA${this.generateRandomString(20)}`,
                    signature: 'Unknown',
                    verified: false,
                    stats: { followerCount: 0, followingCount: 0, heartCount: 0, videoCount: 0 }
                };
            }
        } catch (error) {
            this.logError('Fallback also failed');
        }
        return null;
    }

    // ========== REPORTING FUNCTIONS ==========
    
    async sendRealReport(userInfo, reportType = 'user', reasonCode = 7004) {
        const maxRetries = 2;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const reportReasons = {
                    7001: 'Illegal activities',
                    7004: 'Harassment or bullying',
                    7006: 'Nudity or sexual content', 
                    7009: 'Spam or fake engagement',
                    7014: 'Hate speech'
                };

                const payload = {
                    report_type: reportType === 'user' ? 1 : 2,
                    object_id: userInfo.id,
                    owner_id: userInfo.id,
                    reason: reasonCode,
                    report_scene: reportType === 'user' ? 37 : 39,
                    ...this.generateXSSParams()
                };

                const proxy = this.getRandomWorkingProxy();
                if (!proxy) {
                    return {
                        success: false,
                        error: 'No working proxies available',
                        attempt: attempt
                    };
                }

                const agent = new HttpsProxyAgent(proxy);

                const formData = new URLSearchParams();
                for (const [key, value] of Object.entries(payload)) {
                    formData.append(key, value.toString());
                }

                const headers = {
                    ...this.getHeaders(),
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://www.tiktok.com',
                    'Referer': `https://www.tiktok.com/@${userInfo.uniqueId}`,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cookie': `msToken=${this.generateRandomString(32)}; ttwid=1%7C${this.generateRandomString(16)}`
                };

                this.logInfo(`[Attempt ${attempt}] Sending report via ${proxy.split('//')[1].split(':')[0]}`);
                this.log(`🎯 ${colors.yellow}Reason: ${reportReasons[reasonCode]} (${reasonCode})${colors.reset}`);

                const response = await this.client.post(TIKTOK_APIS.REPORT, formData, {
                    headers,
                    httpsAgent: agent,
                    timeout: 10000
                });

                return {
                    success: response.data?.status_code === 0,
                    reportId: response.data?.data?.report_id || `RPT_${Date.now()}`,
                    message: response.data?.msg || 'Unknown response',
                    statusCode: response.status,
                    responseData: response.data,
                    proxyUsed: proxy
                };

            } catch (error) {
                this.logError(`Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt === maxRetries) {
                    return {
                        success: false,
                        error: error.message,
                        statusCode: error.response?.status,
                        responseData: error.response?.data,
                        attempt: attempt
                    };
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    async bulkReport(userInfo, count = 3) {
        this.printLine('red');
        this.log(`${colors.red}🚀 STARTING BULK REPORT FOR @${userInfo.uniqueId}${colors.reset}`);
        this.log(`${colors.red}📊 TARGET: ${count} REPORTS${colors.reset}`);
        this.printLine('red');
        
        const reasons = [7001, 7004, 7006, 7009, 7014];
        let successCount = 0;
        const results = [];

        for (let i = 1; i <= count; i++) {
            this.printLine('blue');
            this.log(`${colors.blue}📨 [REPORT ${i}/${count}]${colors.reset}`);
            
            const reason = reasons[Math.floor(Math.random() * reasons.length)];
            const result = await this.sendRealReport(userInfo, 'user', reason);
            
            results.push({
                attempt: i,
                reason: reason,
                ...result
            });

            if (result.success) {
                successCount++;
                this.logSuccess(`REPORT SUCCESS!`);
                this.log(`   ${colors.green}🆔 Report ID: ${result.reportId}${colors.reset}`);
                this.log(`   ${colors.green}📝 Message: ${result.message}${colors.reset}`);
            } else {
                this.logError(`REPORT FAILED: ${result.error}`);
            }

            this.log(`   ${colors.cyan}🌐 HTTP Status: ${result.statusCode}${colors.reset}`);
            
            const delay = 4000 + Math.random() * 4000;
            this.log(`   ${colors.yellow}⏳ Waiting ${(delay/1000).toFixed(1)}s...${colors.reset}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.printLine('green');
        this.logSuccess(`BULK REPORT COMPLETE: ${successCount}/${count} SUCCESSFUL`);
        this.printLine('green');
        
        return { successCount, total: count, results };
    }

    // ========== UTILITY FUNCTIONS ==========
    
    printLine(color = 'white') {
        const line = '═'.repeat(60);
        console.log(colors[color] + `╔${line}╗` + colors.reset);
    }

    generateXSSParams() {
        return {
            verifyFp: this.generateVerifyFp(),
            device_id: this.generateRandomString(16),
            iid: this.generateRandomString(16),
            openudid: this.generateRandomString(16),
        };
    }

    generateVerifyFp() {
        return 'verify_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    }

    generateRandomString(length) {
        return crypto.randomBytes(Math.ceil(length/2)).toString('hex').substring(0, length);
    }
}

// ========== MAIN APPLICATION ==========
async function main() {
    console.clear();
    console.log(TIKTOK_ASCII);
    
    const scraper = new TikTokScraper();
    
    // Initialize proxies first
    const workingProxies = await scraper.initializeProxies();
    
    if (workingProxies.length === 0) {
        scraper.logError('No working proxies found! Please check your internet connection.');
        scraper.logWarning('Make sure socks4.txt, socks5.txt, and http.txt exist in the same folder.');
        rl.close();
        return;
    }
    
    rl.question(`${colors.cyan}🎯 ENTER USERNAME TO TARGET: ${colors.reset}`, async (username) => {
        username = username.replace('@', '').trim();
        
        if (!username) {
            scraper.logError('Username required!');
            rl.close();
            return;
        }

        try {
            scraper.printLine('cyan');
            scraper.logInfo(`Gathering intelligence on @${username}...`);
            
            const userInfo = await scraper.scrapeUserProfile(username);
            
            if (!userInfo) {
                scraper.logError('User not found or cannot be accessed');
                rl.close();
                return;
            }

            scraper.printLine('green');
            scraper.logSuccess('USER PROFILE FOUND:');
            scraper.log(`   ${colors.green}👤 ID: ${userInfo.id}${colors.reset}`);
            scraper.log(`   ${colors.green}📛 Name: ${userInfo.nickname}${colors.reset}`);
            scraper.log(`   ${colors.green}🔐 SecUID: ${userInfo.secUid}${colors.reset}`);
            scraper.log(`   ${colors.green}✅ Verified: ${userInfo.verified ? 'Yes' : 'No'}${colors.reset}`);
            scraper.printLine('green');

            // START REPORTING
            const reportResult = await scraper.bulkReport(userInfo, 3);
            
            // SUMMARY
            scraper.printLine('magenta');
            scraper.log(`${colors.magenta}📈 MISSION SUMMARY:${colors.reset}`);
            scraper.log(`   ${colors.magenta}🎯 Target: @${username}${colors.reset}`);
            scraper.log(`   ${colors.magenta}✅ Successful Reports: ${reportResult.successCount}${colors.reset}`);
            scraper.log(`   ${colors.magenta}📊 Success Rate: ${((reportResult.successCount/reportResult.total)*100).toFixed(1)}%${colors.reset}`);
            scraper.log(`   ${colors.magenta}🌐 Working Proxies: ${workingProxies.length}${colors.reset}`);
            scraper.printLine('magenta');

        } catch (error) {
            scraper.logError(`SYSTEM ERROR: ${error.message}`);
        }
        
        rl.close();
    });
}

// Auto-install dependencies
function checkDependencies() {
    const deps = ['axios', 'jsdom', 'https-proxy-agent'];
    const missing = [];
    
    for (const dep of deps) {
        try {
            require(dep);
        } catch {
            missing.push(dep);
        }
    }
    
    if (missing.length > 0) {
        console.log(`${colors.yellow}📦 Installing missing dependencies...${colors.reset}`);
        const { execSync } = require('child_process');
        execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit' });
        console.log(`${colors.green}✅ Dependencies installed!${colors.reset}`);
    }
}

// Start application
if (require.main === module) {
    checkDependencies();
    main().catch(console.error);
}

module.exports = TikTokScraper;
