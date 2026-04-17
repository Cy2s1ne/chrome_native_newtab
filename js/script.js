const engines = [
    {
        name: 'Google',
        url: 'https://www.google.com/search?q=',
        icon: 'images/google-icon.ico',
        logo: 'images/google-logo-color.png',
        placeholder: '在 Google 上搜索，或者输入一个网址'
    },
    {
        name: 'Baidu',
        url: 'https://www.baidu.com/s?wd=',
        icon: 'images/baidu-icon.ico',
        logo: 'images/baidu-logo.png',
        placeholder: '百度一下，你就知道'
    },    {
        name: 'Bing',
        url: 'https://www.bing.com/search?q=',
        icon: 'images/bing-icon.ico',
        logo: 'images/Bing-logo.png',
        placeholder: '微软必应搜索'
    },
    {
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q=',
        icon: 'images/duckduckgo-icon.ico',
        logo: 'images/duckduckgo-logo.svg',
        placeholder: 'DuckDuckGo Search'
    }
];

const defaultEngineIndex = 0;
let currentEngine = engines[defaultEngineIndex];

const searchInput = document.getElementById('search-input');
const searchLogo = document.getElementById('search-logo');
const switcherBtn = document.getElementById('switcher-btn');
const currentEngineIcon = document.getElementById('current-engine-icon');
const engineMenu = document.getElementById('engine-menu');
const timeDisplay = document.getElementById('time-display');
const settingsBtn = document.getElementById('settings-btn');
const clearBgBtn = document.getElementById('clear-bg-btn');
const bgUpload = document.getElementById('bg-upload');
const logoContainer = document.querySelector('.logo-container');

// 初始化
function init() {
    // 从 storage 获取上次选择的搜索引擎
    chrome.storage.sync.get(['selectedEngineIndex'], function(result) {
        const index = result.selectedEngineIndex !== undefined ? result.selectedEngineIndex : defaultEngineIndex;
        setEngine(index);
    });

    // 加载背景图片
    loadBackground();

    renderMenu();
    setupEventListeners();
    setupInputPreferences();
    
    // 启动时间更新
    updateTime();
    setInterval(updateTime, 1000);

    // 页面加载动画
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50);
}

function setupInputPreferences() {
    // 尽早聚焦搜索框，减少手动切换输入的动作。
    setTimeout(() => {
        searchInput.focus({ preventScroll: true });
    }, 0);

    // 尝试向浏览器表达“优先启用输入法”的意图（部分平台可能忽略）。
    searchInput.style.imeMode = 'active';
}

function loadBackground() {
    chrome.storage.local.get(['backgroundImage'], function(result) {
        if (result.backgroundImage) {
            document.body.style.backgroundImage = `url(${result.backgroundImage})`;
            enableCustomBackgroundMode(true);
        } else {
            document.body.style.backgroundImage = 'none';
            enableCustomBackgroundMode(false);
        }
    });
}

function enableCustomBackgroundMode(enabled) {
    if (enabled) {
        logoContainer.style.display = 'none';
        timeDisplay.style.display = 'block';
        clearBgBtn.style.display = 'block'; // 显示清除按钮
        document.body.classList.add('custom-bg');
        // 调整文字颜色为白色以适应背景
        document.body.style.color = '#fff';
    } else {
        logoContainer.style.display = 'block';
        timeDisplay.style.display = 'none';
        clearBgBtn.style.display = 'none'; // 隐藏清除按钮
        document.body.classList.remove('custom-bg');
        document.body.style.color = ''; // 恢复默认
    }
}

function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}`;
}

function setEngine(index) {
    currentEngine = engines[index];
    
    // 更新 UI
    currentEngineIcon.src = currentEngine.icon;
    searchLogo.src = currentEngine.logo;
    searchInput.placeholder = currentEngine.placeholder;
    
    // 针对不同 logo 调整样式 (可选)
    if (currentEngine.name === 'Baidu') {
        searchLogo.style.height = 'auto';
        searchLogo.style.width = '260px'; // 增大百度 Logo
    } else if (currentEngine.name === 'Bing') {
        searchLogo.style.height = 'auto';
        searchLogo.style.width = '300px'; // 调整本地 Bing Logo 大小
    } else if (currentEngine.name === 'DuckDuckGo') {
        searchLogo.style.height = '80px'; // 增大 DuckDuckGo Logo
        searchLogo.style.width = 'auto';
    } else {
        // Google default
        // 如果是 Doodle，尺寸可能不同，这里先重置为默认，fetchDoodle 会再次调整
        searchLogo.style.height = '110px'; // 增大 Google Logo
        searchLogo.style.width = 'auto';
    }
    
    updateLogoForTheme(); // 检查主题并更新 Logo

    // 保存选择
    chrome.storage.sync.set({selectedEngineIndex: index});
}

function updateLogoForTheme() {
    // 简单的 Logo 适配逻辑
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (currentEngine.name === 'Google') {
        if (isDarkMode) {
            searchLogo.src = 'images/google-logo-light.png';
        } else {
            searchLogo.src = 'images/google-logo-color.png';
        }
    } else {
        // 其他引擎如果需要特定深色 Logo 可以在这里处理
        searchLogo.src = currentEngine.logo;
    }

    // 更新 Favicon
    updateFavicon(isDarkMode);
}

function updateFavicon(isDarkMode) {
    const link = document.querySelector("link[rel~='icon']");
    if (!link) {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        document.head.appendChild(newLink);
    }
    
    // 移除所有现有的 icon link，重新添加正确的
    const existingLinks = document.querySelectorAll("link[rel~='icon']");
    existingLinks.forEach(el => el.remove());

    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.type = 'image/svg';
    
    if (isDarkMode) {
        newLink.href = 'icons/dark_icon16.svg';
    } else {
        newLink.href = 'icons/icon16.svg';
    }
    document.head.appendChild(newLink);
}

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateLogoForTheme);

function renderMenu() {
    engineMenu.innerHTML = '';
    engines.forEach((engine, index) => {
        const option = document.createElement('div');
        option.className = 'engine-option';
        option.innerHTML = `
            <img src="${engine.icon}" alt="${engine.name}">
            <span>${engine.name}</span>
        `;
        option.addEventListener('click', () => {
            setEngine(index);
            engineMenu.classList.remove('show');
        });
        engineMenu.appendChild(option);
    });
}

function setupEventListeners() {
    // 切换菜单显示/隐藏
    switcherBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        engineMenu.classList.toggle('show');
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', () => {
        engineMenu.classList.remove('show');
    });

    // 设置按钮点击
    settingsBtn.addEventListener('click', () => {
        bgUpload.click();
    });

    // 清除背景按钮点击
    clearBgBtn.addEventListener('click', () => {
        if (confirm('确定要清除背景图片吗？')) {
            chrome.storage.local.remove('backgroundImage', function() {
                loadBackground();
            });
        }
    });

    // 背景图片上传
    bgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64String = event.target.result;
                // 保存到 local storage (unlimitedStorage 权限允许保存大文件)
                try {
                    chrome.storage.local.set({backgroundImage: base64String}, function() {
                        if (chrome.runtime.lastError) {
                            console.error("Error saving background:", chrome.runtime.lastError);
                            alert("图片太大，无法保存。请尝试较小的图片。");
                        } else {
                            loadBackground();
                        }
                    });
                } catch (error) {
                    console.error("Error saving background:", error);
                    alert("保存背景图片时出错。");
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // 搜索功能
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                // 检查是否是 URL
                if (isValidURL(query)) {
                    let url = query;
                    if (!/^https?:\/\//i.test(url)) {
                        url = 'http://' + url;
                    }
                    window.location.href = url;
                } else {
                    window.location.href = currentEngine.url + encodeURIComponent(query);
                }
            }
        }
    });
}

function isValidURL(string) {
    // 简单的 URL 验证
    const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null);
}

init();
