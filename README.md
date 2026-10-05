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
Toàn bộ ảnh/video lấy từ artifact "Phong Kiến Trúc" (9 dự án Onsen, ảnh bìa, chân dung, video hero) bằng `scripts/import-artifact.mjs`.
- Ảnh hero: `public/img/hero.webp`, chân dung: `public/img/portrait.webp`, video: `public/video/hero.mp4`
- Ảnh dự án: `public/img/projects/<id>/NN.webp` (+ `NN-s.webp` bản nhỏ); thêm ảnh mới thì khai báo trong `content/projects.json`.

## Deploy lên Hostinger (shared hosting)
Site là HTML tĩnh nên chạy trên shared hosting thường.

**Cách 1 – GitHub tự build (khuyên dùng)**
1. Tạo repo GitHub, push code này lên nhánh `main`.
2. Repo → Settings → Secrets and variables → Actions → tab *Variables* → thêm `SITE_URL` = `https://tenmiencuaban.com`.
3. Mỗi lần push, GitHub Actions build và đẩy `dist/` sang nhánh `deploy`.
4. hPanel → Websites → Advanced → **Git** → thêm repo, nhánh `deploy`, thư mục cài đặt để trống (`public_html`) → Deploy. Bật *Auto deployment* (webhook) nếu muốn.

**Cách 2 – upload tay**: `SITE_URL=https://tenmiencuaban.com npm run build`, rồi tải nội dung `dist/` lên `public_html` (File Manager / FTP).

`.htaccess` đã có sẵn (ép HTTPS, nén, cache, trang 404).

## Hostinger gói Node.js (tuỳ chọn)
`server.js` (Express) phục vụ `dist/`. Build command `npm run build`, start `npm start`.
