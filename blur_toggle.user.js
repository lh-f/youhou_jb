// ==UserScript==
// @name         网页一键模糊防窥屏
// @namespace    http://tampermonkey.net/
// @version      1.0
// @updateURL    https://raw.githubusercontent.com/lh-f/youhou_jb/main/blur_toggle.user.js
// @downloadURL  https://raw.githubusercontent.com/lh-f/youhou_jb/main/blur_toggle.user.js
// @description  按Ctrl+B快捷键切换网页模糊，防止他人窥屏
// @author       AI助手
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @license Apache-2.0
// ==/UserScript==

(function() {
    'use strict';
    const MASK_ID = '__tampermonkey_blur_mask__';
    const STYLE_ID = '__tampermonkey_blur_style__';

    function createBlurMask(root = document) {
        if (root.getElementById && root.getElementById(MASK_ID)) return;
        // 创建遮罩层
        const mask = root.createElement('div');
        mask.id = MASK_ID;
        mask.style.position = 'fixed';
        mask.style.top = '0';
        mask.style.left = '0';
        mask.style.width = '100vw';
        mask.style.height = '100vh';
        mask.style.zIndex = '999999999';
        mask.style.pointerEvents = 'none';
        mask.style.backdropFilter = 'blur(12px)';
        mask.style.background = 'rgba(255,255,255,0.15)';
        mask.style.transition = 'backdrop-filter 0.2s';
        root.body.appendChild(mask);
        // 插入样式，兼容不支持backdrop-filter的浏览器
        if (root.getElementById && !root.getElementById(STYLE_ID)) {
            const style = root.createElement('style');
            style.id = STYLE_ID;
            style.innerHTML = `
                #${MASK_ID} {
                    -webkit-backdrop-filter: blur(12px);
                    backdrop-filter: blur(12px);
                }
            `;
            root.head.appendChild(style);
        }
    }

    function removeBlurMask(root = document) {
        const mask = root.getElementById && root.getElementById(MASK_ID);
        if (mask) mask.remove();
        const style = root.getElementById && root.getElementById(STYLE_ID);
        if (style) style.remove();
    }

    function toggleBlur() {
        // 处理主文档
        if (document.getElementById(MASK_ID)) {
            removeBlurMask(document);
        } else {
            createBlurMask(document);
        }
        // 处理所有同源iframe
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (!doc) return;
                if (doc.getElementById(MASK_ID)) {
                    removeBlurMask(doc);
                } else {
                    createBlurMask(doc);
                }
            } catch (e) {
                // 跨域iframe忽略
            }
        });
        // 处理所有Shadow DOM
        function traverseShadow(rootNode) {
            if (!rootNode) return;
            if (rootNode.shadowRoot) {
                if (rootNode.shadowRoot.getElementById(MASK_ID)) {
                    removeBlurMask(rootNode.shadowRoot);
                } else {
                    createBlurMask(rootNode.shadowRoot);
                }
                Array.from(rootNode.shadowRoot.children).forEach(traverseShadow);
            } else if (rootNode.children) {
                Array.from(rootNode.children).forEach(traverseShadow);
            }
        }
        traverseShadow(document.body);

        // 保存当前模糊状态到本地存储
        GM_setValue('isBlurred', document.getElementById(MASK_ID) !== null);
    }

    document.addEventListener('keydown', function(e) {
        // Alt+Q
        if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey && (e.key === 'q' || e.key === 'Q')) {
            e.preventDefault();
            toggleBlur();
        }
    });

    // 页面加载时检查并恢复模糊状态
    window.addEventListener('load', function() {
        if (GM_getValue('isBlurred', false)) {
            toggleBlur();
        }
    });
})();
