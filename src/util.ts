// all copy from klingai.kuishou.com
export const lN = {
    UNKNOWN: 0,
    NOT_EXIST: 4,
    QUEUING: 5,
    RUNNING: 10,
    UNQUALIFIED_INPUT: 6,
    SENSITIVE_RESULT: 9,
    FAIL: 50,
    NO_FACE: 51,
    PAYMENT_FAIL: 52,
    PARTIAL_COMPLETED: 98,
    COMPLETED: 99,
    SAFE_INPUT: 3,
    SENSITIVE_TEXT: 7,
    SENSITIVE_IMAGE: 8,
  },
  iN = {
    EMPTY: 0,
    PROCESSING: 1,
    SUCCESS: 2,
    FAILED: 3,
  },
  styles = Object.entries({
    default: {
      name: "默认",
      caption: {
        en: "Default",
        zh: "默认",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-default-CkQfXq2b.png",
    },
    pixar: {
      name: "皮克斯",
      caption: {
        en: "Pixar",
        zh: "皮克斯",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-pixar-BRLTNK-9.png",
    },
    cartoon: {
      name: "卡通盲盒",
      caption: {
        en: "Cartoon",
        zh: "卡通盲盒",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-cartoon-BZ8oHLjg.png",
    },
    shinkai: {
      name: "新海诚",
      caption: {
        en: "Shinkai",
        zh: "新海诚",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-shinkai-CjJmVM9r.png",
    },
    threed: {
      name: "动漫3D",
      caption: {
        en: "3D",
        zh: "动漫3D",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-3d-DovrSQzs.png",
    },
    old: {
      name: "怀旧动漫",
      caption: {
        en: "Old Style",
        zh: "怀旧动漫",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-old-Dl-qVENQ.png",
    },
    realistic: {
      name: "高清写实",
      caption: {
        en: "Realistic",
        zh: "高清写实",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-realistic-DXb6rrm0.png",
    },
    game: {
      name: "电子游戏",
      caption: {
        en: "Game",
        zh: "电子游戏",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-game-DK4oO4JX.png",
    },
    watercolor: {
      name: "水彩插画",
      caption: {
        en: "Watercolor",
        zh: "水彩插画",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-watercolor-C1dyMRTC.png",
    },
    monet: {
      name: "莫奈油画",
      caption: {
        en: "Monet",
        zh: "莫奈油画",
      },
      image: "https://ali2.a.kwimgs.com/kos/nlav10378/aiwp/assets/style-monet-D7oeBcPg.png",
    },
  }),
  gF = {
    empty: "empty",
    "down-back": "down_back",
    "forward-up": "forward_up",
    "right-turn-forward": "right_turn_forward",
    "left-turn-forward": "left_turn_forward",
    "translate-x": "horizontal",
    "translate-y": "vertical",
    "translate-z": "zoom",
    "rotate-x": "tilt",
    "rotate-y": "pan",
    "rotate-z": "roll",
  };

export function isTaskNotExist(e: number) {
  return [lN.NOT_EXIST].includes(e);
}

export function isTaskStatusSuccess(e: number): boolean {
  return [lN.COMPLETED, lN.PARTIAL_COMPLETED].includes(e);
}

export function isTaskStatusProcessing(e: number) {
  return [lN.QUEUING, lN.RUNNING].includes(e);
}

export function isTaskStatusFailed(e: number) {
  return !isTaskNotExist(e) && !isTaskStatusSuccess(e) && !isTaskStatusProcessing(e);
}

export const imageURLPreviewArguments = "?x-oss-process=image/resize%2Cw_376%2Ch_376%2Cm_mfit";
