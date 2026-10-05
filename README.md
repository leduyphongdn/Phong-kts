# PHONG ARCHITECT – website

Website portfolio song ngữ Việt–Anh, giao diện tối điện ảnh. Viết bằng Node.js, sinh ra site tĩnh trong `dist/`.

## Chạy trên máy
```bash
npm install
npm run dev        # build + mở http://localhost:3000
```

## Sửa nội dung
| Việc | File |
|---|---|
| Tên, SĐT, email, tên miền, văn bản hai ngôn ngữ | `content/site.json` |
| Dự án (tên, địa điểm, năm, chủ đầu tư, quy mô, mô tả VI/EN, ảnh bìa, nổi bật) | `content/projects.json` |
| Hồ sơ cá nhân (chức danh, giới thiệu) | `content/profile.json` (tiếng Việt) và `content/site.json` (hai ngôn ngữ) |
| Giao diện | `src/assets/style.css`, `src/assets/app.js` |

Trường để trống (`location`, `year`, ...) sẽ tự ẩn trên trang dự án. Ví dụ điền một dự án:
```json
"location": "Phú Quốc", "year": "2025", "summary": { "vi": "Mô tả...", "en": "Description..." }
```

## Ảnh và video
Thư mục nguồn `PROJECTS/TỔNG HỢP DỰ ÁN` là nguồn sự thật: mỗi thư mục con = một dự án (nhóm theo thư mục cha). Chạy `node scripts/import-source.mjs` để nén ảnh sang WebP (tối đa 2800 px) và tạo lại `content/projects.json`. Dự án không có trong thư mục nguồn sẽ bị bỏ khỏi web. Tên/mô tả giữ trong `content/overrides.json`.
Hero: `public/img/hero.webp`, `public/video/hero*.mp4`; chân dung: `public/img/portrait.webp`.

## Deploy miễn phí bằng GitHub Pages
1. Push code lên nhánh `main` (workflow `.github/workflows/pages.yml` tự build).
2. Repo → Settings → Pages → **Build and deployment → Source: GitHub Actions**.
3. Sau khi workflow xanh, site ở `https://<tài-khoản>.github.io/<tên-repo>/` (hiện tại: https://leduyphongdn.github.io/Phong-kts/).

Build có tiền tố thư mục con nhờ biến `BASE_PATH`. Khi dùng tên miền riêng ở gốc (vd phongarchitect.com) thì bỏ `BASE_PATH`:
```bash
SITE_URL=https://phongarchitect.com npm run build   # rồi upload dist/ lên hosting bất kỳ
```
`public/.htaccess` dành cho Apache/Hostinger. `server.js` (Express) phục vụ `dist/` nếu chạy Node.js.
