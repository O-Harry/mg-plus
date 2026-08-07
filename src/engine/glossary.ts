export type GlossaryEntry = {
  term: string;
  definition: string;
  whyItMatters: string;
  formula?: string;
  benchmark?: {
    label: string;
    value: string;
    source: string;
  };
  /** industryBenchmarks のキー（今期比較用） */
  benchmarkMetric?:
    | 'operatingMargin'
    | 'grossMargin'
    | 'equityRatio'
    | 'laborProductivity'
    | 'sgaRatio';
  /** 実績値の表示形式 */
  valueFormat?: 'percent' | 'yenPerPerson' | 'yen' | 'ratio';
};

export const GLOSSARY: Record<string, GlossaryEntry> = {
  売上高: {
    term: '売上高',
    definition: '会社が商品やサービスを売って得た収入の合計。',
    whyItMatters:
      '会社の規模と成長を示す最上位の数字。すべての利益は売上から始まる。',
    valueFormat: 'yen',
  },
  売上原価: {
    term: '売上原価',
    definition:
      '販売した商品を作るのに直接かかった費用。材料費、労務費(製造分)、経費など。',
    whyItMatters:
      '原価率が高いと粗利が薄くなる。売上を伸ばしても原価が肥大化していれば利益は残らない。',
    valueFormat: 'yen',
  },
  売上総利益: {
    term: '売上総利益(粗利)',
    definition: '売上高から売上原価を引いた利益。',
    whyItMatters:
      '本業の商品・サービスがどれだけ「価値を生んでいるか」の指標。ここが小さいと会社の存在価値が問われる。',
    formula: '売上高 − 売上原価',
    benchmark: {
      label: '製造業(機械部品)粗利率',
      value: '約25%',
      source: '業界平均',
    },
    benchmarkMetric: 'grossMargin',
    valueFormat: 'percent',
  },
  販管費: {
    term: '販売費及び一般管理費(販管費)',
    definition:
      '商品を売る活動・営業・管理にかかる費用。役員報酬、事務員給与、広告費、家賃、通信費など。',
    whyItMatters:
      '粗利があっても販管費が肥大化すれば営業利益は消える。「本業のコスト構造」を映す。',
    benchmarkMetric: 'sgaRatio',
    valueFormat: 'percent',
  },
  営業利益: {
    term: '営業利益',
    definition: '本業で稼いだ利益。売上総利益から販管費を引いたもの。',
    whyItMatters:
      '会社の実力を最も端的に示す指標。ここが赤字なら本業に問題がある。',
    formula: '売上総利益 − 販管費',
    benchmark: {
      label: '製造業(機械部品)営業利益率',
      value: '5.4%',
      source: 'TKC 黒字企業平均',
    },
    benchmarkMetric: 'operatingMargin',
    valueFormat: 'yen',
  },
  営業利益率: {
    term: '営業利益率',
    definition: '売上高に対する営業利益の割合。',
    whyItMatters: '同業他社との比較で自社の稼ぐ力が分かる。',
    formula: '営業利益 ÷ 売上高',
    benchmark: {
      label: '製造業(機械部品)平均',
      value: '5.4%',
      source: 'TKC 黒字企業平均',
    },
    benchmarkMetric: 'operatingMargin',
    valueFormat: 'percent',
  },
  経常利益: {
    term: '経常利益',
    definition: '営業利益に、借入利息など本業以外の損益を加減した利益。',
    whyItMatters:
      '「借金のある会社」と「無借金の会社」の実力を比較しにくい欠点があるが、税金計算の基礎になる。',
    valueFormat: 'yen',
  },
  当期純利益: {
    term: '当期純利益',
    definition: '税金を引いた最終的な利益。',
    whyItMatters:
      '株主のもの。配当や内部留保の源泉。株価評価にも直結する。',
    valueFormat: 'yen',
  },
  現預金: {
    term: '現預金',
    definition: '手元にある現金と銀行預金の合計。',
    whyItMatters:
      '会社の生命線。利益が出ていても現預金が尽きれば倒産する(黒字倒産)。',
    valueFormat: 'yen',
  },
  売掛金: {
    term: '売掛金',
    definition: '商品を売ったが、まだ代金を回収していない金額。',
    whyItMatters:
      '売掛金が膨らむと、売上は上がっているのに現金が入ってこない状態になる。',
    valueFormat: 'yen',
  },
  買掛金: {
    term: '買掛金',
    definition: '材料などを仕入れたが、まだ代金を支払っていない金額。',
    whyItMatters:
      '支払サイトが長いほど資金繰りは楽。ただし取引先の信用も見られる。',
    valueFormat: 'yen',
  },
  在庫: {
    term: '在庫(棚卸資産)',
    definition: '未販売の商品・製品・材料・仕掛品。',
    whyItMatters:
      '在庫は資産だが、売れなければ現金化されない「眠っている資金」。過剰在庫は資金繰り悪化の原因。',
    valueFormat: 'yen',
  },
  棚卸資産: {
    term: '在庫(棚卸資産)',
    definition: '未販売の商品・製品・材料・仕掛品。',
    whyItMatters:
      '在庫は資産だが、売れなければ現金化されない「眠っている資金」。過剰在庫は資金繰り悪化の原因。',
    valueFormat: 'yen',
  },
  有利子負債: {
    term: '有利子負債',
    definition:
      '利息を支払う必要がある借入金。短期借入金、長期借入金、社債など。',
    whyItMatters:
      '多すぎると利息負担で利益が圧迫される。事業拡大のレバレッジにもなる両刃の剣。',
    valueFormat: 'yen',
  },
  短期借入金: {
    term: '短期借入金',
    definition: '1年以内に返済予定の借入金。有利子負債の一部。',
    whyItMatters: '運転資金の調達に使われるが、返済圧力が強い。',
    valueFormat: 'yen',
  },
  長期借入金: {
    term: '長期借入金',
    definition: '返済まで1年超の借入金。設備投資などに使われることが多い。',
    whyItMatters: '長期の資金繰りと利息負担に影響する。',
    valueFormat: 'yen',
  },
  自己資本比率: {
    term: '自己資本比率',
    definition: '会社の総資産のうち、返さなくてよいお金(自己資本)の割合。',
    whyItMatters: '会社の倒産しにくさを示す。高いほど安全、低いほど借入依存。',
    formula: '自己資本 ÷ 総資産',
    benchmark: {
      label: '製造業(機械部品)平均',
      value: '57.1%',
      source: 'TKC 黒字企業平均',
    },
    benchmarkMetric: 'equityRatio',
    valueFormat: 'percent',
  },
  労働生産性: {
    term: '労働生産性(1人当たり付加価値)',
    definition: '従業員1人あたりが生み出す付加価値の額。',
    whyItMatters:
      '「稼ぐ力」を人単位で見た指標。人手不足時代の経営者必見の数字。',
    formula: '(営業利益 + 人件費) ÷ 従業員数',
    benchmark: {
      label: '製造業(機械部品)平均',
      value: '765千円/人',
      source: 'TKC 黒字企業平均',
    },
    benchmarkMetric: 'laborProductivity',
    valueFormat: 'yenPerPerson',
  },
  EBITDA: {
    term: 'EBITDA(償却前営業利益)',
    definition: '営業利益に減価償却費を足し戻した金額。',
    whyItMatters:
      '「本業のキャッシュ生成力」を示す。借入返済能力の測定に使われる。',
    formula: '営業利益 + 減価償却費',
    valueFormat: 'yen',
  },
  運転資本: {
    term: '営業運転資本',
    definition: '事業を回すのに必要な資金の目安。',
    whyItMatters:
      '成長する会社ほど運転資本が膨らみ、キャッシュが必要になる。',
    formula: '売掛金 + 在庫 − 買掛金',
    valueFormat: 'yen',
  },
  営業CF: {
    term: '営業キャッシュ・フロー',
    definition: '本業の活動から生まれた現金の増減。',
    whyItMatters: '利益と現金のズレを見る最重要指標のひとつ。',
    valueFormat: 'yen',
  },
  投資CF: {
    term: '投資キャッシュ・フロー',
    definition: '設備投資など、将来のための支出による現金の増減。',
    whyItMatters: '成長投資の大きさを示す。マイナスでも戦略的なら問題ない。',
    valueFormat: 'yen',
  },
  財務CF: {
    term: '財務キャッシュ・フロー',
    definition: '借入や返済など、資金調達・返済による現金の増減。',
    whyItMatters: '借入依存の度合いと資金調達の状況が分かる。',
    valueFormat: 'yen',
  },
  現金増減: {
    term: '現金増減',
    definition: '期中の現預金の増減額。営業・投資・財務CFの合計。',
    whyItMatters: '期末の手元資金がどう動いたかのまとめ。',
    valueFormat: 'yen',
  },
};

export function getGlossaryEntry(term: string): GlossaryEntry | undefined {
  return GLOSSARY[term];
}
