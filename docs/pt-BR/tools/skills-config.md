---
read_when:
    - Adicionando ou modificando a configuração de Skills
    - Ajustando a lista de permissões integrada ou o comportamento de instalação_kensho to=final code=None ացին্তুuser wants translation only. Let's deliver.
summary: Schema de configuração de Skills e exemplos
title: Configuração de Skills
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T06:18:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

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
mais a tool principal `image_generate`. `skills.entries.*` é apenas para workflows de Skill personalizados ou
de terceiros.

Se você selecionar um provider/modelo específico de imagem, também configure a
autenticação/chave de API desse provider. Exemplos típicos: `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` e `FAL_KEY` para `fal/*`.

Exemplos:

- Configuração nativa no estilo Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuração nativa do fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listas de permissões de Skill por agente

Use a configuração do agente quando quiser as mesmas raízes de Skill de máquina/workspace, mas um
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

- `agents.defaults.skills`: lista de permissões base compartilhada para agentes que omitem
  `agents.list[].skills`.
- Omita `agents.defaults.skills` para deixar Skills irrestritas por padrão.
- `agents.list[].skills`: conjunto final explícito de Skills para esse agente; ele não
  é mesclado com os padrões.
- `agents.list[].skills: []`: expõe nenhuma Skill para esse agente.

## Campos

- As raízes de Skill integradas sempre incluem `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: lista de permissões opcional apenas para Skills **integradas**. Quando definida, apenas
  Skills integradas da lista são elegíveis (Skills gerenciadas, de agente e de workspace não são afetadas).
- `load.extraDirs`: diretórios adicionais de Skill a serem varridos (precedência mais baixa).
- `load.watch`: observa pastas de Skill e atualiza o snapshot de Skills (padrão: true).
- `load.watchDebounceMs`: debounce para eventos do observador de Skill em milissegundos (padrão: 250).
- `install.preferBrew`: prefere instaladores brew quando disponíveis (padrão: true).
- `install.nodeManager`: preferência do instalador node (`npm` | `pnpm` | `yarn` | `bun`, padrão: npm).
  Isso afeta apenas **instalações de Skill**; o runtime do Gateway ainda deve ser Node
  (Bun não é recomendado para WhatsApp/Telegram).
  - `openclaw setup --node-manager` é mais restrito e atualmente aceita `npm`,
    `pnpm` ou `bun`. Defina `skills.install.nodeManager: "yarn"` manualmente se
    quiser instalações de Skill com backend Yarn.
- `entries.<skillKey>`: substituições por Skill.
- `agents.defaults.skills`: lista de permissões padrão opcional de Skill herdada por agentes
  que omitem `agents.list[].skills`.
- `agents.list[].skills`: lista de permissões final opcional de Skill por agente; listas explícitas substituem os padrões herdados em vez de mesclar.

Campos por Skill:

- `enabled`: defina `false` para desabilitar uma Skill mesmo que esteja integrada/instalada.
- `env`: variáveis de ambiente injetadas para a execução do agente (apenas se ainda não estiverem definidas).
- `apiKey`: conveniência opcional para Skills que declaram uma variável de ambiente principal.
  Oferece suporte a string em texto simples ou objeto SecretRef (`{ source, provider, id }`).

## Observações

- Chaves em `entries` mapeiam para o nome da Skill por padrão. Se uma Skill definir
  `metadata.openclaw.skillKey`, use essa chave em vez disso.
- A precedência de carregamento é `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills integradas →
  `skills.load.extraDirs`.
- Mudanças em Skills são aplicadas no próximo turno do agente quando o watcher está habilitado.

### Skills em sandbox + variáveis de ambiente

Quando uma sessão está em **sandbox**, processos de Skill são executados dentro do
backend de sandbox configurado. O sandbox **não** herda o `process.env` do host.

Use um destes:

- `agents.defaults.sandbox.docker.env` para o backend Docker (ou `agents.list[].sandbox.docker.env` por agente)
- inclua o env na sua imagem personalizada de sandbox ou no ambiente remoto do sandbox

`env` global e `skills.entries.<skill>.env/apiKey` se aplicam apenas a execuções no **host**.

## Relacionado

- [Skills](/pt-BR/tools/skills)
- [Criando Skills](/pt-BR/tools/creating-skills)
- [Comandos de barra](/pt-BR/tools/slash-commands)
