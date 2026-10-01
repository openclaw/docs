export const chromeStrings = {
  en: {
    communityDismissLabel: "Dismiss and don't show again",
    communityTitle: "Find your people",
    communityBody: "Questions, projects, and the latest from OpenClaw.",
    onThisPage: "On this page",
  },
  "zh-CN": {
    communityDismissLabel: "关闭且不再显示",
    communityTitle: "找到同好",
    communityBody: "交流问题、分享项目，了解 OpenClaw 的最新动态。",
    onThisPage: "本页内容",
  },
  "zh-TW": {
    communityDismissLabel: "關閉且不再顯示",
    communityTitle: "找到同好",
    communityBody: "交流問題、分享專案，掌握 OpenClaw 的最新動態。",
    onThisPage: "本頁內容",
  },
  "ja-JP": {
    communityDismissLabel: "閉じて今後は表示しない",
    communityTitle: "仲間を見つけよう",
    communityBody: "質問やプロジェクト、OpenClaw の最新情報を共有しましょう。",
    onThisPage: "このページの内容",
  },
  es: {
    communityDismissLabel: "Cerrar y no volver a mostrar",
    communityTitle: "Encuentra tu comunidad",
    communityBody: "Preguntas, proyectos y las últimas novedades de OpenClaw.",
    onThisPage: "En esta página",
  },
  "pt-BR": {
    communityDismissLabel: "Fechar e não mostrar novamente",
    communityTitle: "Encontre sua comunidade",
    communityBody: "Dúvidas, projetos e as novidades do OpenClaw.",
    onThisPage: "Nesta página",
  },
  ko: {
    communityDismissLabel: "닫고 다시 표시하지 않기",
    communityTitle: "함께할 사람들을 만나세요",
    communityBody: "질문과 프로젝트, OpenClaw의 최신 소식을 나눠 보세요.",
    onThisPage: "이 페이지에서",
  },
  de: {
    communityDismissLabel: "Schließen und nicht mehr anzeigen",
    communityTitle: "Finde deine Community",
    communityBody: "Fragen, Projekte und Neuigkeiten rund um OpenClaw.",
    onThisPage: "Auf dieser Seite",
  },
  fr: {
    communityDismissLabel: "Fermer et ne plus afficher",
    communityTitle: "Trouvez votre communauté",
    communityBody: "Questions, projets et dernières nouvelles d’OpenClaw.",
    onThisPage: "Sur cette page",
  },
  hi: {
    communityDismissLabel: "बंद करें और दोबारा न दिखाएं",
    communityTitle: "अपनी कम्युनिटी खोजें",
    communityBody: "सवाल, प्रोजेक्ट और OpenClaw की ताज़ा खबरें।",
    onThisPage: "इस पेज पर",
  },
  ar: {
    communityDismissLabel: "إغلاق وعدم الإظهار مرة أخرى",
    communityTitle: "اعثر على مجتمعك",
    communityBody: "أسئلة ومشاريع وآخر أخبار OpenClaw.",
    onThisPage: "في هذه الصفحة",
  },
  it: {
    communityDismissLabel: "Chiudi e non mostrare più",
    communityTitle: "Trova la tua community",
    communityBody: "Domande, progetti e le ultime novità di OpenClaw.",
    onThisPage: "In questa pagina",
  },
  vi: {
    communityDismissLabel: "Đóng và không hiển thị lại",
    communityTitle: "Tìm cộng đồng của bạn",
    communityBody: "Câu hỏi, dự án và tin tức mới nhất từ OpenClaw.",
    onThisPage: "Trên trang này",
  },
  nl: {
    communityDismissLabel: "Sluiten en niet meer tonen",
    communityTitle: "Vind je community",
    communityBody: "Vragen, projecten en het laatste nieuws over OpenClaw.",
    onThisPage: "Op deze pagina",
  },
  fa: {
    communityDismissLabel: "بستن و دیگر نشان ندادن",
    communityTitle: "جامعهٔ خود را پیدا کنید",
    communityBody: "پرسش‌ها، پروژه‌ها و تازه‌ترین خبرهای OpenClaw.",
    onThisPage: "در این صفحه",
  },
  tr: {
    communityDismissLabel: "Kapat ve bir daha gösterme",
    communityTitle: "Topluluğunu bul",
    communityBody: "Sorular, projeler ve OpenClaw’dan son haberler.",
    onThisPage: "Bu sayfada",
  },
  uk: {
    communityDismissLabel: "Закрити й більше не показувати",
    communityTitle: "Знайдіть свою спільноту",
    communityBody: "Запитання, проєкти й останні новини OpenClaw.",
    onThisPage: "На цій сторінці",
  },
  id: {
    communityDismissLabel: "Tutup dan jangan tampilkan lagi",
    communityTitle: "Temukan komunitasmu",
    communityBody: "Pertanyaan, proyek, dan kabar terbaru dari OpenClaw.",
    onThisPage: "Di halaman ini",
  },
  pl: {
    communityDismissLabel: "Zamknij i nie pokazuj ponownie",
    communityTitle: "Znajdź swoją społeczność",
    communityBody: "Pytania, projekty i najnowsze wieści o OpenClaw.",
    onThisPage: "Na tej stronie",
  },
  ru: {
    communityDismissLabel: "Закрыть и больше не показывать",
    communityTitle: "Найдите своё сообщество",
    communityBody: "Вопросы, проекты и последние новости OpenClaw.",
    onThisPage: "На этой странице",
  },
  th: {
    communityDismissLabel: "ปิดและไม่ต้องแสดงอีก",
    communityTitle: "พบชุมชนของคุณ",
    communityBody: "คำถาม โปรเจกต์ และข่าวสารล่าสุดจาก OpenClaw",
    onThisPage: "ในหน้านี้",
  },
};

export function chromeStringsForLocale(locale) {
  return chromeStrings[locale] ?? chromeStrings.en;
}
