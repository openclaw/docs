---
read_when:
    - Adicionando ou modificando a configuração de Skills
    - Ajustando a allowlist incluída ou o comportamento de instalação
summary: esquema de configuração de Skills e exemplos
title: Configuração de Skills
x-i18n:
    generated_at: "2026-04-23T14:08:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Configuração de Skills

A maior parte da configuração de carregamento/instalação de Skills fica em `skills` em
`~/.openclaw/openclaw.json`. A visibilidade de Skills específica por agente fica em
`agents.defaults.skills` e `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (o runtime do Gateway continua sendo Node; bun não é recomendado)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto simples
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Para geração/edição de imagem integrada, prefira `agents.defaults.imageGenerationModel`
mais a ferramenta central `image_generate`. `skills.entries.*` serve apenas para
fluxos de trabalho de Skills personalizadas ou de terceiros.

Se você selecionar um provider/modelo de imagem específico, também configure a
autenticação/chave de API desse provider. Exemplos típicos: `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` e `FAL_KEY` para `fal/*`.

Exemplos:

- Configuração nativa estilo Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuração nativa do fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlists de Skills por agente

Use a configuração de agente quando quiser as mesmas raízes de Skills da máquina/workspace, mas um
conjunto visível diferente de Skills por agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // herda os padrões -> github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui os padrões
      { id: "locked-down", skills: [] }, // sem Skills
    ],
  },
}
```

Regras:

- `agents.defaults.skills`: allowlist base compartilhada para agentes que omitem
  `agents.list[].skills`.
- Omita `agents.defaults.skills` para deixar as Skills sem restrição por padrão.
- `agents.list[].skills`: conjunto final explícito de Skills para esse agente; ele não
  é mesclado com os padrões.
- `agents.list[].skills: []`: não expõe nenhuma Skills para esse agente.

## Campos

- As raízes de Skills integradas sempre incluem `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: allowlist opcional apenas para Skills **incluídas**. Quando definida, apenas
  as Skills incluídas na lista são elegíveis (Skills gerenciadas, de agente e de workspace não são afetadas).
- `load.extraDirs`: diretórios adicionais de Skills para verificar (menor precedência).
- `load.watch`: observa pastas de Skills e atualiza o snapshot de Skills (padrão: true).
- `load.watchDebounceMs`: debounce para eventos do watcher de Skills em milissegundos (padrão: 250).
- `install.preferBrew`: prefere instaladores brew quando disponíveis (padrão: true).
- `install.nodeManager`: preferência de instalador Node (`npm` | `pnpm` | `yarn` | `bun`, padrão: npm).
  Isso afeta apenas **instalações de Skills**; o runtime do Gateway ainda deve ser Node
  (`bun` não é recomendado para WhatsApp/Telegram).
  - `openclaw setup --node-manager` é mais restrito e atualmente aceita `npm`,
    `pnpm` ou `bun`. Defina `skills.install.nodeManager: "yarn"` manualmente se
    quiser instalações de Skills com suporte de Yarn.
- `entries.<skillKey>`: substituições por skill.
- `agents.defaults.skills`: allowlist padrão opcional de Skills herdada por agentes
  que omitem `agents.list[].skills`.
- `agents.list[].skills`: allowlist final opcional de Skills por agente; listas explícitas
  substituem padrões herdados em vez de fazer merge.

Campos por skill:

- `enabled`: defina como `false` para desativar uma skill mesmo que ela esteja incluída/instalada.
- `env`: variáveis de ambiente injetadas para a execução do agente (somente se ainda não estiverem definidas).
- `apiKey`: conveniência opcional para Skills que declaram uma variável de env principal.
  Compatível com string em texto simples ou objeto SecretRef (`{ source, provider, id }`).

## Observações

- As chaves em `entries` correspondem ao nome da skill por padrão. Se uma skill definir
  `metadata.openclaw.skillKey`, use essa chave.
- A precedência de carregamento é `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills incluídas →
  `skills.load.extraDirs`.
- Alterações em Skills são aplicadas no próximo turno do agente quando o watcher estiver ativado.

### Skills em sandbox + variáveis de ambiente

Quando uma sessão está **em sandbox**, os processos de Skills são executados dentro do
backend de sandbox configurado. O sandbox **não** herda o `process.env` do host.

Use uma destas opções:

- `agents.defaults.sandbox.docker.env` para o backend Docker (ou `agents.list[].sandbox.docker.env` por agente)
- incorporar o env à sua imagem de sandbox personalizada ou ao ambiente remoto de sandbox

`env` global e `skills.entries.<skill>.env/apiKey` se aplicam apenas a execuções **no host**.
