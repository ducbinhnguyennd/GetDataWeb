// const { chromium } = require('playwright');
// const fs = require('fs');

// let browser;
// let page;

// // Bước 2: Click vào Đăng Nhập
// async function clickLogin() {
//     // Tìm và click vào phần tử Đăng Nhập
//     if (!page || !browser || !page.isClosed()) {
//         console.error('Trình duyệt hoặc trang web đã đóng. Không thể thực hiện đăng nhập.');
//         return;
//     }
//     await page.click('a[href="https://truyenyy.pro/auth/betatruyen/"]');

// // Đợi cho trang đăng nhập tải lên
// await page.waitForSelector('input#form-login_username');

// // Nhập tài khoản và mật khẩu
// await page.fill('input#form-login_username', 'vdc173@gmail.com');
// await page.fill('input#form-login_password', 'lytamhoam');

// // Click vào checkbox recaptcha
// await page.click('.recaptcha-checkbox-border');

// // Đợi cho recaptcha được xử lý (có thể cần thời gian để xác nhận)
// await page.waitForTimeout(5000); // Đợi 5 giây (tùy thuộc vào trang web)

// // Click vào nút Tiến Hành Đăng Nhập
// await page.click('button.btn-primary');

// // Đợi cho trang hoàn tất đăng nhập (có thể thêm waitForSelector hoặc waitForNavigation)
// await page.waitForNavigation();
// }

// // Bước 4: Lấy Dữ Liệu từ Các Phần Tử có Class "info"
// async function scrapeWebPages(url) {
//     browser = await chromium.launch();
//     page = await browser.newPage();

//     await page.goto(url);

//     // Lấy dữ liệu từ các phần tử có class "info"
//     const infoElements = await page.$$('.info');
//     for (const infoElement of infoElements) {
//         const infoData = await infoElement.textContent();
//         console.log('Thông tin:', infoData);

//         // Tạo thư mục để lưu truyện (nếu chưa tồn tại)
//         const sanitizedInfoData = infoData.replace(/[\/\?<>\\:\*\|":]/g, ''); // Loại bỏ các ký tự không hợp lệ
//         const folderName = `Truyen_${sanitizedInfoData.trim()}`;
//         if (!fs.existsSync(folderName)) {
//             fs.mkdirSync(folderName);
//         }

//         // Bước 5: Truy Cập và Lấy Dữ Liệu từ Các Chương và Nội Dung
//         const detailPageURL = await infoElement.$eval('a', link => link.href);
//         const detailPage = await browser.newPage();
//         await detailPage.goto(detailPageURL);

//         const chapterElements = await detailPage.$$('.chapter');
//         for (const chapterElement of chapterElements) {
//             // Lấy thông tin chương và nội dung
//             const chapterTitle = await chapterElement.$eval('.chapter-title', title => title.textContent.trim());
//             const chapterContent = await chapterElement.$eval('.chapter-content', content => content.textContent.trim());

//             console.log('Chương:', chapterTitle);

//             // Lưu nội dung chương vào file
//             const fileName = `${folderName}/${chapterTitle.replace(/[\/\?<>\\:\*\|":]/g, '')}.txt`; // Loại bỏ các ký tự không hợp lệ
//             fs.writeFileSync(fileName, chapterContent);

//             console.log(`Nội Dung chương "${chapterTitle}" đã được lưu vào file ${fileName}`);
//         }

//         await detailPage.close();
//     }

//     await browser.close();
// }

// // Bước 1: Truy cập Trang Chủ
// async function accessHomePage() {
//     browser = await chromium.launch();
//     page = await browser.newPage();

//     await page.goto('https://truyenyy.pro/');

//     // Thực hiện các thao tác cần thiết trên trang chủ

//     await browser.close();
// }

// // Thực hiện tuần tự các bước
// async function main() {
//     await accessHomePage();
//     await clickLogin();
//     await scrapeWebPages('https://truyenyy.pro/');
// }

// // Gọi hàm main
// main();


const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function waitForLoad(page) {
    await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        page.waitForLoadState('networkidle'),
    ]);
}

async function scrapeChapterInfo(page, title, chapterLink) {
    // Tạo đường link đầy đủ
    const fullChapterLink = `${chapterLink}`;

    // Di chuyển đến trang chương
    await page.goto(fullChapterLink);
    await waitForLoad(page);
    console.log(`Đến link chương: ${fullChapterLink}`);

    // Lấy thông tin chương
    const chapterTitleSelector = '.chap-title';
    await page.waitForSelector(chapterTitleSelector, { timeout: 30000 });
    const chapterTitle = await page.$eval(chapterTitleSelector, el => el.innerText);

    const contentSelector = '.heading-font.mt-2';
    await page.waitForSelector(contentSelector, { timeout: 30000 });
    const chapterContent = await page.$eval(contentSelector, el => el.innerText);
    const contentMainSelector = '.chap-content.serif-font.no-select';
    let contentMainTitle; // Đặt biến ở mức độ phạm vi toàn cục

    try {
        // Chờ cho phần tử có class "chap-content.serif-font.no-select" xuất hiện
        await page.waitForSelector(contentMainSelector, { timeout: 30000 });

        // Lấy nội dung chương
        const contentMainElement = await page.$(contentMainSelector);
        if (contentMainElement) {
            contentMainTitle = await contentMainElement.innerText();
            console.log(`Nội dung chương (main): ${contentMainTitle}`);
        } else {
            console.error(`Không thể tìm thấy phần tử ${contentMainSelector}.`);
        }
    } catch (error) {
        console.error(`Không thể tìm thấy phần tử ${contentMainSelector}.`);
    }

    const buyButton = await page.$('#btn_buy');
    if (buyButton) {
        await buyButton.click();

        try {
            // Chờ cho phần tử có class "weui-dialog__btn primary" xuất hiện
            await page.waitForSelector('.weui-dialog__btn.primary', { timeout: 30000 });

            // Trỏ tới phần tử có class "weui-dialog__btn primary" và click vào nó
            const acceptButton = await page.$('.weui-dialog__btn.primary');
            if (acceptButton) {
                await acceptButton.click();
                console.log('Đã xác nhận mua.');
            } else {
                console.log('Không tìm thấy nút xác nhận mua.');
            }
        } catch (error) {
            console.error('Không thể tìm thấy phần tử ".weui-dialog__btn.primary".');
        }
    }
    //  else {
    //     console.log('Không tìm thấy nút mua chương này.');
    // }
    // Tạo thư mục và lưu thông tin chương vào file txt
    const folderName = title.replace(/[/\\?%*:|"<>]/g, '_');
    const filePath = path.join(folderName, `thong_tin_${chapterLink.split('/').pop().replace('.html', '')}.txt`);

    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
    }

    const contentToWrite = `
        Tiêu đề truyện: ${title}
        Tiêu đề chương: ${chapterTitle}
        Nội dung chương: ${chapterContent}
        Nội dung chương (main): ${contentMainTitle}
    `;

    fs.writeFileSync(filePath, contentToWrite, 'utf-8');
    console.log(`Thông tin chương đã được lưu vào file ${filePath}`);
}


async function getChapterLinks(page, link) {
    const chapterLinks = [];

    let currentPage = 1;
    let hasNewChapter = true;

    while (hasNewChapter) {
        const currentChapterLink = `https://truyenyy.pro${link}chuong-${currentPage}.html`;
        await page.goto(`${currentChapterLink}`, { waitUntil: 'domcontentloaded' });
        console.log(`${currentChapterLink}`);
        chapterLinks.push(currentChapterLink);

        const nextPageLink = `https://truyenyy.pro${link}chuong-${currentPage + 1}.html`;
        const response = await page.goto(`${nextPageLink}`, { waitUntil: 'domcontentloaded', timeout: 5000 });

        // Kiểm tra xem trang tiếp theo đã load thành công hay không
        if (response.status() !== 200) {
            hasNewChapter = false;
        }

        currentPage++;

    }

    return chapterLinks;
}



async function main() {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const cookiesToAdd = [
        { name: '_ga', value: 'GA1.1.1373651993.1705294395', domain: 'truyenyy.pro', path: '/' },
        { name: 'messages', value: 'W1siX19qc29uX21lc3NhZ2UiLDAsMjUsIlN1Y2Nlc3SmdWxseSBzaWduZWQgaW4gYXMgdnVkaW5oY3VvbmcxMTM4NDIuIl1d:1rQ2el:erphiTg4--3qkMuVQGdmvqIBHwDh3s490FeYSXM1BUc', domain: 'truyenyy.pro', path: '/' },
        { name: 'csrftoken', value: 'izrCqkhRjfsLrm1jTPs15JYVBiqjYwOjmQPCMtxBi3DKzTSAunBIMKusUjoUrxCo', domain: 'truyenyy.pro', path: '/' },
        { name: 'truyenyyid', value: 'evpi7t0c0xuqa80kjx0yl2lgv9q9b1id', domain: 'truyenyy.pro', path: '/' },
        { name: '_ga_6SE80VQKJ2', value: 'GS1.1.1705485270.4.1.1705485385.0.0.0', domain: 'truyenyy.pro', path: '/' },
    ];

    await page.context().addCookies(cookiesToAdd);

    // Mở trực tiếp trang web
    await page.goto('https://truyenyy.pro');

    // Kiểm tra xem có cookies nào đã được lưu hay không
    const cookies = await context.cookies();

    // if (cookies.length > 0) {
    //     console.log('Cookies đã được lưu:', cookies);
    // } else {
    //     console.log('Không có cookies nào được lưu.');
    // }
    // Kiểm tra nếu trang web yêu cầu đăng nhập
    if (page.url().includes('login')) {
        console.error('Đăng nhập không thành công');
    } else {
        console.log('Đăng nhập thành công');

        // Thực hiện click vào liên kết cụ thể
        const link = '/truyen/khong-duoc-phep-tuoc-doat-quyen-lam-nguoi-cua-toi/';
        await page.goto(`https://truyenyy.pro${link}`);
        await waitForLoad(page);
        console.log('Đến link ok');
        console.log(`https://truyenyy.pro${link}`);

        // Chờ đến khi phần tử ".name" xuất hiện trong DOM
        const titleSelector = '.name';
        await page.waitForSelector(titleSelector);

        // Lấy thông tin về tiêu đề truyện
        const title = await page.$eval(titleSelector, el => el.innerText);
        console.log(`Tiêu đề truyện: ${title}`);

        // Lấy danh sách các chương từ bảng
        ;
        const chapterLinks = await getChapterLinks(page, link);

        // In ra đường dẫn của từng chương
        console.log("Danh sách các chương:");
        console.log(chapterLinks);

        // Lặp qua từng chương và lấy thông tin
        for (let i = 0; i < chapterLinks.length; i++) {
            const chapterLink = chapterLinks[i];
            await scrapeChapterInfo(page, title, chapterLink);
        }

        // Đóng trình duyệt
        await browser.close();
    }
}

// Gọi hàm chính
main();
