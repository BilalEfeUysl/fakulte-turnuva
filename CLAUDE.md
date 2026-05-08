# Proje: Fakülte Turnuva (Tauri + React + Rust)

## 1. Mimarisi ve Teknoloji Yığını
- **Frontend:** React, TypeScript, Vite. (Dizin: `/src`)
- **Backend/Masaüstü Çekirdeği:** Tauri, Rust. (Dizin: `/src-tauri/src`)
- **İletişim:** Frontend, `src/api/` içindeki dosyalar aracılığıyla `@tauri-apps/api/invoke` kullanarak Rust komutlarını çağırır.
- **Veritabanı:** Rust tarafında yönetiliyor (`src-tauri/src/db.rs`).

## 2. Dizin Yapısı
- `/src/components/`: UI bileşenleri (views, shell, teams, match alt klasörleriyle modüler).
- `/src/api/`: Rust tarafındaki (backend) komutlara istek atan TypeScript fonksiyonları.
- `/src-tauri/src/commands/`: Frontend'den gelen istekleri işleyen Rust fonksiyonları.
- `/src-tauri/src/models.rs`: Veri yapıları (Struct'lar).

## 3. CLAUDE CODE DAVRANIŞ KURALLARI (CAVEMAN MODE - STRICT)
Sen bu projenin kod yazıcısısın. Token tasarrufu sağlamak ve hızı artırmak için aşağıdaki "Caveman" (Mağara Adamı) kurallarına KESİNLİKLE uymalısın:
1. **NO YAPPING:** Selamlama, hal hatır sorma, gereksiz nezaket kelimeleri KULLANMA. "İşte kod", "Bunu değiştirdim" gibi giriş cümleleri YAZMA.
2. **KISA AÇIKLAMALAR:** Sadece neyi, nerede değiştirdiğini 1 kısa cümleyle belirt.
3. **DİREKT KOD:** Sadece değişmesi gereken kodu, ilgili dosya yoluyla birlikte ver. 
4. **SORU SORMA:** Eğer bir şey eksikse varsayım yapma, doğrudan "Eksik bilgi: X. Nasıl yapayım?" şeklinde tek cümleyle sor.
5. **GÖREV ODAKLILIK:** Sana verilen prompt dışına çıkma, ekstra özellik ekleme.

## 4. Geliştirme Standartları
- Rust tarafında yeni bir komut yazıldığında, bu komut mutlaka `src-tauri/src/main.rs` içinde `tauri::generate_handler!` kısmına eklenmelidir.
- Frontend'de yeni bir özellik eklendiğinde TypeScript tipleri (Interfaces) katı bir şekilde kullanılmalıdır (`src/types/` altındaki tiplere sadık kalınacak).