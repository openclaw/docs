---
read_when:
    - Você quer analisar PDFs a partir de agentes
    - Você precisa dos parâmetros e limites exatos da ferramenta de PDF
    - Você está depurando o modo nativo de PDF versus o fallback de extração
summary: Analise um ou mais documentos PDF com suporte nativo do provedor e fallback de extração
title: Ferramenta de PDF
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T13:57:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analisa um ou mais documentos PDF e retorna texto.

Comportamento rápido:

- Modo nativo de provedor para provedores de modelo Anthropic e Google.
- Modo de fallback de extração para outros provedores (extrai texto primeiro e, depois, imagens de página quando necessário).
- Suporta entrada única (`pdf`) ou múltipla (`pdfs`), com no máximo 10 PDFs por chamada.

## Disponibilidade

A ferramenta só é registrada quando o OpenClaw consegue resolver uma configuração de modelo compatível com PDF para o agente:

1. `agents.defaults.pdfModel`
2. fallback para `agents.defaults.imageModel`
3. fallback para o modelo de sessão/padrão resolvido do agente
4. se provedores nativos de PDF usarem autenticação, prefira-os antes de candidatos genéricos de fallback de imagem

Se nenhum modelo utilizável puder ser resolvido, a ferramenta `pdf` não será exposta.

Observações sobre disponibilidade:

- A cadeia de fallback leva em conta autenticação. Um `provider/model` configurado só conta se
  o OpenClaw realmente conseguir autenticar esse provedor para o agente.
- Os provedores nativos de PDF atualmente são **Anthropic** e **Google**.
- Se o provedor de sessão/padrão resolvido já tiver um modelo de visão/PDF configurado,
  a ferramenta de PDF reutilizará esse modelo antes de recorrer a outros
  provedores com autenticação.

## Referência de entrada

<ParamField path="pdf" type="string">
Um caminho ou URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Vários caminhos ou URLs de PDF, até 10 no total.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt de análise.
</ParamField>

<ParamField path="pages" type="string">
Filtro de páginas como `1-5` ou `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Substituição opcional de modelo no formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite de tamanho por PDF em MB. O padrão é `agents.defaults.pdfMaxBytesMb` ou `10`.
</ParamField>

Observações sobre entrada:

- `pdf` e `pdfs` são mesclados e deduplicados antes do carregamento.
- Se nenhuma entrada de PDF for fornecida, a ferramenta retorna erro.
- `pages` é interpretado como números de página com base 1, deduplicados, ordenados e limitados ao máximo de páginas configurado.
- `maxBytesMb` usa por padrão `agents.defaults.pdfMaxBytesMb` ou `10`.

## Referências de PDF compatíveis

- caminho de arquivo local (incluindo expansão de `~`)
- URL `file://`
- URL `http://` e `https://`
- refs de entrada gerenciadas pelo OpenClaw, como `media://inbound/<id>`

Observações sobre referências:

- Outros esquemas de URI (por exemplo, `ftp://`) são rejeitados com `unsupported_pdf_reference`.
- No modo sandbox, URLs remotas `http(s)` são rejeitadas.
- Com a política de arquivo somente workspace habilitada, caminhos de arquivo locais fora das raízes permitidas são rejeitados.
- Refs de entrada gerenciadas e caminhos reproduzidos no armazenamento de mídia recebida do OpenClaw são permitidos com a política de arquivo somente workspace.

## Modos de execução

### Modo nativo de provedor

O modo nativo é usado para os provedores `anthropic` e `google`.
A ferramenta envia bytes brutos do PDF diretamente para as APIs do provedor.

Limites do modo nativo:

- `pages` não é compatível. Se estiver definido, a ferramenta retorna um erro.
- Entrada com múltiplos PDFs é compatível; cada PDF é enviado como um bloco de documento nativo /
  parte PDF inline antes do prompt.

### Modo de fallback de extração

O modo de fallback é usado para provedores não nativos.

Fluxo:

1. Extrai texto das páginas selecionadas (até `agents.defaults.pdfMaxPages`, padrão `20`).
2. Se o comprimento do texto extraído for menor que `200` caracteres, renderiza as páginas selecionadas como imagens PNG e as inclui.
3. Envia o conteúdo extraído mais o prompt para o modelo selecionado.

Detalhes do fallback:

- A extração de imagens de página usa um orçamento de pixels de `4,000,000`.
- Se o modelo de destino não oferecer suporte a entrada de imagem e não houver texto extraível, a ferramenta retorna erro.
- Se a extração de texto for bem-sucedida, mas a extração de imagem exigir visão em um
  modelo somente de texto, o OpenClaw descarta as imagens renderizadas e continua com o texto extraído.
- O fallback de extração usa o Plugin `document-extract` empacotado. O Plugin é owner de
  `pdfjs-dist`; `@napi-rs/canvas` é usado apenas quando o fallback de renderização de imagem está
  disponível.

## Configuração

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference) para obter detalhes completos dos campos.

## Detalhes de saída

A ferramenta retorna texto em `content[0].text` e metadados estruturados em `details`.

Campos comuns de `details`:

- `model`: referência do modelo resolvido (`provider/model`)
- `native`: `true` para modo nativo de provedor, `false` para fallback
- `attempts`: tentativas de fallback que falharam antes do sucesso

Campos de caminho:

- entrada com um único PDF: `details.pdf`
- entrada com múltiplos PDFs: `details.pdfs[]` com entradas `pdf`
- metadados de reescrita de caminho do sandbox (quando aplicável): `rewrittenFrom`

## Comportamento de erro

- Entrada de PDF ausente: gera `pdf required: provide a path or URL to a PDF document`
- PDFs em excesso: retorna erro estruturado em `details.error = "too_many_pdfs"`
- Esquema de referência não compatível: retorna `details.error = "unsupported_pdf_reference"`
- Modo nativo com `pages`: gera um erro claro `pages is not supported with native PDF providers`

## Exemplos

PDF único:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Vários PDFs:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Modelo de fallback com filtro de páginas:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas disponíveis para o agente
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — configuração de pdfMaxBytesMb e pdfMaxPages
