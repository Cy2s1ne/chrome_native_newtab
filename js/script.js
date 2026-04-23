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
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const resetSettingsBtn = document.getElementById('reset-settings-btn');

// 默认设置
const defaultSettings = {
    // 颜色
    bgColor: '#ffffff',
    textColor: '#202124',
    searchBgColor: '#ffffff',
    searchBorderColor: '#dfe1e5',
    searchBorderHoverColor: '#dfe1e5',
    searchShadowColor: '#000000',
    btnBgColor: '#ffffff',
    iconColor: '#9aa0a6',
    // 搜索框
    searchWidth: 100,
    searchHeight: 64,
    searchRadius: 30,
    searchMarginTop: 0,
    // Logo
    logoHeight: 110,
    logoMargin: 38,
    // 透明度
    bgOpacity: 100,
    // 打开方式
    openTarget: 'new'
};

let currentSettings = { ...defaultSettings };

// 初始化
function init() {
    // 从 storage 获取上次选择的搜索引擎
    chrome.storage.sync.get(['selectedEngineIndex'], function(result) {
        const index = result.selectedEngineIndex !== undefined ? result.selectedEngineIndex : defaultEngineIndex;
        setEngine(index);
    });

    // 加载背景图片
    loadBackground();

    // 加载自定义设置
    loadSettings();

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

    // 设置按钮点击 - 打开设置面板
    settingsBtn.addEventListener('click', () => {
        populateSettingsUI();
        settingsPanel.classList.add('show');
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
                let url;
                // 检查是否是 URL
                if (isValidURL(query)) {
                    if (!/^https?:\/\//i.test(query)) {
                        url = 'http://' + query;
                    } else {
                        url = query;
                    }
                } else {
                    url = currentEngine.url + encodeURIComponent(query);
                }

                // 根据设置决定打开方式
                if (currentSettings.openTarget === 'new') {
                    chrome.tabs.create({ url: url });
                } else {
                    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                        if (tabs[0]) {
                            chrome.tabs.update(tabs[0].id, { url: url });
                        } else {
                            chrome.tabs.create({ url: url });
                        }
                    });
                }
            }
        }
    });

    // 设置面板事件
    setupSettingsEventListeners();
}

function isValidURL(string) {
    // 简单的 URL 验证
    const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null);
}

// 设置相关函数
function loadSettings() {
    chrome.storage.sync.get(['customSettings'], function(result) {
        if (result.customSettings) {
            currentSettings = { ...defaultSettings, ...result.customSettings };
        }
        applySettings();
        populateSettingsUI();
    });
}

function saveSettings() {
    chrome.storage.sync.set({ customSettings: currentSettings }, function() {
        applySettings();
        settingsPanel.classList.remove('show');
    });
}

function resetSettings() {
    currentSettings = { ...defaultSettings };
    populateSettingsUI();
    applySettings();
}

function applySettings() {
    // 颜色设置
    document.body.style.backgroundColor = currentSettings.bgColor;
    document.body.style.color = currentSettings.textColor;

    const searchBox = document.querySelector('.search-box');
    searchBox.style.backgroundColor = currentSettings.searchBgColor;
    searchBox.style.borderColor = currentSettings.searchBorderColor;
    searchBox.style.boxShadow = `0 1px 6px rgba(${hexToRgb(currentSettings.searchShadowColor)},.28)`;

    document.querySelector('.search-icon svg').style.fill = currentSettings.iconColor;
    document.querySelector('#search-input').style.color = currentSettings.textColor;

    const settingsIcon = document.querySelector('.settings-icon');
    const clearBgIcon = document.querySelector('.clear-bg-icon');
    if (settingsIcon) settingsIcon.style.backgroundColor = currentSettings.btnBgColor;
    if (clearBgIcon) clearBgIcon.style.backgroundColor = currentSettings.btnBgColor;

    // 搜索框尺寸设置
    searchBox.style.width = currentSettings.searchWidth + '%';
    searchBox.style.maxWidth = currentSettings.searchWidth + '%';
    searchBox.style.height = currentSettings.searchHeight + 'px';
    searchBox.style.borderRadius = currentSettings.searchRadius + 'px';

    const searchContainer = document.querySelector('.search-container');
    searchContainer.style.marginTop = currentSettings.searchMarginTop + 'px';

    // Logo 设置
    searchLogo.style.height = currentSettings.logoHeight + 'px';
    logoContainer.style.marginBottom = currentSettings.logoMargin + 'px';

    // 透明度设置
    document.body.style.opacity = currentSettings.bgOpacity / 100;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '0, 0, 0';
}

function populateSettingsUI() {
    // 颜色输入
    document.getElementById('bg-color').value = currentSettings.bgColor;
    document.getElementById('bg-color-text').value = currentSettings.bgColor;
    document.getElementById('text-color').value = currentSettings.textColor;
    document.getElementById('text-color-text').value = currentSettings.textColor;
    document.getElementById('search-bg-color').value = currentSettings.searchBgColor;
    document.getElementById('search-bg-color-text').value = currentSettings.searchBgColor;
    document.getElementById('search-border-color').value = currentSettings.searchBorderColor;
    document.getElementById('search-border-color-text').value = currentSettings.searchBorderColor;
    document.getElementById('search-border-hover-color').value = currentSettings.searchBorderHoverColor;
    document.getElementById('search-border-hover-color-text').value = currentSettings.searchBorderHoverColor;
    document.getElementById('search-shadow-color').value = currentSettings.searchShadowColor;
    document.getElementById('search-shadow-color-text').value = currentSettings.searchShadowColor;
    document.getElementById('btn-bg-color').value = currentSettings.btnBgColor;
    document.getElementById('btn-bg-color-text').value = currentSettings.btnBgColor;
    document.getElementById('icon-color').value = currentSettings.iconColor;
    document.getElementById('icon-color-text').value = currentSettings.iconColor;

    // 滑块设置
    document.getElementById('search-width').value = currentSettings.searchWidth;
    document.getElementById('search-width-value').textContent = currentSettings.searchWidth + '%';

    document.getElementById('search-height').value = currentSettings.searchHeight;
    document.getElementById('search-height-value').textContent = currentSettings.searchHeight + 'px';

    document.getElementById('search-radius').value = currentSettings.searchRadius;
    document.getElementById('search-radius-value').textContent = currentSettings.searchRadius + 'px';

    document.getElementById('search-margin-top').value = currentSettings.searchMarginTop;
    document.getElementById('search-margin-top-value').textContent = currentSettings.searchMarginTop + 'px';

    document.getElementById('logo-height').value = currentSettings.logoHeight;
    document.getElementById('logo-height-value').textContent = currentSettings.logoHeight + 'px';

    document.getElementById('logo-margin').value = currentSettings.logoMargin;
    document.getElementById('logo-margin-value').textContent = currentSettings.logoMargin + 'px';

    document.getElementById('bg-opacity').value = currentSettings.bgOpacity;
    document.getElementById('bg-opacity-value').textContent = currentSettings.bgOpacity + '%';

    // 打开方式设置
    if (currentSettings.openTarget === 'current') {
        document.getElementById('open-current').checked = true;
    } else {
        document.getElementById('open-new').checked = true;
    }
}

function setupSettingsEventListeners() {
    // 打开/关闭设置面板
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.add('show');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('show');
    });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsPanel.classList.contains('show')) {
            settingsPanel.classList.remove('show');
        }
    });

    // 颜色输入同步
    const colorInputs = [
        { color: 'bg-color', text: 'bg-color-text', key: 'bgColor' },
        { color: 'text-color', text: 'text-color-text', key: 'textColor' },
        { color: 'search-bg-color', text: 'search-bg-color-text', key: 'searchBgColor' },
        { color: 'search-border-color', text: 'search-border-color-text', key: 'searchBorderColor' },
        { color: 'search-border-hover-color', text: 'search-border-hover-color-text', key: 'searchBorderHoverColor' },
        { color: 'search-shadow-color', text: 'search-shadow-color-text', key: 'searchShadowColor' },
        { color: 'btn-bg-color', text: 'btn-bg-color-text', key: 'btnBgColor' },
        { color: 'icon-color', text: 'icon-color-text', key: 'iconColor' }
    ];

    colorInputs.forEach(({ color, text, key }) => {
        const colorInput = document.getElementById(color);
        const textInput = document.getElementById(text);

        colorInput.addEventListener('input', (e) => {
            textInput.value = e.target.value;
            currentSettings[key] = e.target.value;
            applySettings();
        });

        textInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                colorInput.value = value;
                currentSettings[key] = value;
                applySettings();
            }
        });
    });

    // 滑块设置
    const sliders = [
        { id: 'search-width', valueId: 'search-width-value', key: 'searchWidth', suffix: '%' },
        { id: 'search-height', valueId: 'search-height-value', key: 'searchHeight', suffix: 'px' },
        { id: 'search-radius', valueId: 'search-radius-value', key: 'searchRadius', suffix: 'px' },
        { id: 'search-margin-top', valueId: 'search-margin-top-value', key: 'searchMarginTop', suffix: 'px' },
        { id: 'logo-height', valueId: 'logo-height-value', key: 'logoHeight', suffix: 'px' },
        { id: 'logo-margin', valueId: 'logo-margin-value', key: 'logoMargin', suffix: 'px' },
        { id: 'bg-opacity', valueId: 'bg-opacity-value', key: 'bgOpacity', suffix: '%' }
    ];

    sliders.forEach(({ id, valueId, key, suffix }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);

        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            currentSettings[key] = value;
            valueDisplay.textContent = value + suffix;
            applySettings();
        });
    });

    // 打开方式设置
    document.getElementById('open-current').addEventListener('change', (e) => {
        currentSettings.openTarget = e.target.value;
        applySettings();
    });

    document.getElementById('open-new').addEventListener('change', (e) => {
        currentSettings.openTarget = e.target.value;
        applySettings();
    });

    // 保存和重置按钮
    saveSettingsBtn.addEventListener('click', saveSettings);
    resetSettingsBtn.addEventListener('click', resetSettings);
}

init();
