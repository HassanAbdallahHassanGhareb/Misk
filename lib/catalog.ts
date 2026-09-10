export type QuizQuestion = {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
};

export type Lesson = {
  id: string;
  title: string;
  youtubeId: string;
  summary: string;
  keyPoints: string[];
  quiz: QuizQuestion[];
};

export type Unit = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  gradeLabel: string;
  subject: string;
  units: Unit[];
};

export const CATALOG: Course[] = [
  {
    id: "prep3-computer-it",
    gradeLabel: "الصف الثالث الإعدادي",
    subject: "الكمبيوتر وتكنولوجيا المعلومات",
    units: [
      {
        id: "u1",
        title: "الوحدة الأولى: أساسيات الحاسب",
        lessons: [
          {
            id: "l1",
            title: "الدرس 1: مكونات الحاسب الأساسية",
            youtubeId: "dQw4w9WgXcQ",
            summary: "هنتعرف على مكونات الهاردوير الأساسية ووظيفة كل جزء بشكل مبسط.",
            keyPoints: ["CPU هو عقل الجهاز", "RAM للذاكرة المؤقتة", "Storage للتخزين الدائم"],
            quiz: [
              {
                id: "q1",
                question: "مين المسؤول عن تنفيذ التعليمات؟",
                choices: ["RAM", "CPU", "الهارد", "الشاشة"],
                correctIndex: 1,
              },
            ],
          },
          {
            id: "l2",
            title: "الدرس 2: نظام التشغيل والملفات",
            youtubeId: "ysz5S6PUM-U",
            summary: "يعني إيه نظام تشغيل؟ وإزاي نتعامل مع الملفات والمجلدات؟",
            keyPoints: ["نظام التشغيل يدير موارد الجهاز", "الملفات لها امتدادات", "المجلدات لتنظيم الملفات"],
            quiz: [
              {
                id: "q1",
                question: "نظام التشغيل وظيفته الأساسية؟",
                choices: ["تصميم صور", "تشغيل ألعاب فقط", "إدارة الجهاز والبرامج", "كتابة كود فقط"],
                correctIndex: 2,
              },
            ],
          },
        ],
      },
      {
        id: "u2",
        title: "الوحدة الثانية: الإنترنت والأمان",
        lessons: [
          {
            id: "l1",
            title: "الدرس 1: أساسيات الإنترنت",
            youtubeId: "ysz5S6PUM-U",
            summary: "مقدمة مبسطة عن الإنترنت: المتصفح، محركات البحث، وروابط المواقع.",
            keyPoints: ["المتصفح لفتح المواقع", "محرك البحث للعثور على المعلومات", "URL عنوان الموقع"],
            quiz: [
              {
                id: "q1",
                question: "أي مما يلي يُستخدم للبحث عن معلومات على الإنترنت؟",
                choices: ["محرك البحث", "RAM", "CPU", "نظام التشغيل"],
                correctIndex: 0,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "sec1-programming-cs",
    gradeLabel: "الصف الأول الثانوي",
    subject: "البرمجة وعلوم الحاسب",
    units: [
      {
        id: "u1",
        title: "الوحدة الأولى: أساسيات البرمجة",
        lessons: [
          {
            id: "l1",
            title: "الدرس 1: يعني إيه برنامج؟",
            youtubeId: "kqtD5dpn9C8",
            summary: "مفهوم البرنامج والخوارزمية وأمثلة بسيطة.",
            keyPoints: ["البرنامج = تعليمات", "الخوارزمية خطوات للحل", "لازم ترتيب منطقي"],
            quiz: [
              {
                id: "q1",
                question: "الخوارزمية هي:",
                choices: ["لغة برمجة", "مجموعة خطوات لحل مشكلة", "جهاز كمبيوتر", "برنامج جاهز"],
                correctIndex: 1,
              },
            ],
          },
        ],
      },
      {
        id: "u2",
        title: "الوحدة الثانية: تفكير منطقي وحل مشكلات",
        lessons: [
          {
            id: "l1",
            title: "الدرس 1: الشروط والحلقات (فكرة عامة)",
            youtubeId: "kqtD5dpn9C8",
            summary: "هناخد فكرة مبسطة عن الشروط والحلقات وليه بنستخدمهم في حل المشكلات.",
            keyPoints: ["If لاتخاذ قرار", "Loop للتكرار", "تقليل تكرار الكود"],
            quiz: [
              {
                id: "q1",
                question: "الحلقة (Loop) نستخدمها عندما:",
                choices: ["نحتاج قرار", "نحتاج تكرار", "نحتاج تخزين دائم", "نحتاج إنترنت"],
                correctIndex: 1,
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "sec2-programming-ai",
    gradeLabel: "الصف الثاني الثانوي",
    subject: "البرمجة والذكاء الاصطناعي",
    units: [
      {
        id: "u1",
        title: "الوحدة الأولى: برمجة تطبيقية",
        lessons: [
          {
            id: "l1",
            title: "الدرس 1: مراجعة سريعة على أساسيات البرمجة",
            youtubeId: "kqtD5dpn9C8",
            summary: "مراجعة سريعة تساعدك تبني عليها قبل دخول الذكاء الاصطناعي.",
            keyPoints: ["متغيرات", "شروط", "حلقات"],
            quiz: [
              {
                id: "q1",
                question: "المتغير (Variable) هو:",
                choices: ["قيمة ثابتة دائمًا", "مكان لتخزين قيمة يمكن تتغير", "نوع من المعالج", "ملف على الجهاز"],
                correctIndex: 1,
              },
            ],
          },
        ],
      },
      {
        id: "u2",
        title: "الوحدة الثانية: مقدمة الذكاء الاصطناعي",
        lessons: [
          {
            id: "l1",
            title: "الدرس 1: AI vs ML vs DL",
            youtubeId: "2ePf9rue1Ao",
            summary: "هنفهم الفرق بين الذكاء الاصطناعي وتعلم الآلة والتعلم العميق بشكل مبسط.",
            keyPoints: ["AI مفهوم شامل", "ML جزء من AI", "DL جزء من ML"],
            quiz: [
              {
                id: "q1",
                question: "Machine Learning تعتبر:",
                choices: ["جزء من AI", "عكس AI", "نوع من الهاردوير", "نظام تشغيل"],
                correctIndex: 0,
              },
            ],
          },
        ],
      },
    ],
  },
];

export function getCourse(courseId: string) {
  return CATALOG.find((c) => c.id === courseId) ?? null;
}

export function getUnit(courseId: string, unitId: string) {
  const course = getCourse(courseId);
  const unit = course?.units.find((u) => u.id === unitId) ?? null;
  return { course, unit };
}

export function getLesson(courseId: string, unitId: string, lessonId: string) {
  const { course, unit } = getUnit(courseId, unitId);
  const lesson = unit?.lessons.find((l) => l.id === lessonId) ?? null;

  const idx = unit ? unit.lessons.findIndex((l) => l.id === lessonId) : -1;
  const nextLesson = unit && idx >= 0 ? unit.lessons[idx + 1] ?? null : null;
  const prevLesson = unit && idx >= 0 ? unit.lessons[idx - 1] ?? null : null;

  return { course, unit, lesson, nextLesson, prevLesson };
}