---
read_when:
    - Adicionando ou modificando a configuração de Skills
    - Ajustando a lista de permissões integrada ou o comportamento de instalação
summary: Esquema e exemplos de configuração de Skills
title: Configuração de Skills
x-i18n:
    generated_at: "2026-05-06T09:17:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

A maior parte da configuração de carregamento/instalação de skills fica em `skills` em
`~/.openclaw/openclaw.json`. A visibilidade de skills específica do agente fica em
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
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

Para geração/edição de imagens integrada, prefira `agents.defaults.imageGenerationModel`
mais a ferramenta principal `image_generate`. `skills.entries.*` serve apenas para fluxos de trabalho de skills
customizados ou de terceiros.

Se você selecionar um provedor/modelo de imagem específico, configure também a autenticação/chave de API
desse provedor. Exemplos típicos: `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` e `FAL_KEY` para `fal/*`.

Exemplos:

- Configuração nativa no estilo Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuração nativa do fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listas de permissão de skills do agente

Use a configuração do agente quando quiser as mesmas raízes de skills da máquina/workspace,
mas um conjunto diferente de skills visíveis por agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Regras:

- `agents.defaults.skills`: lista de permissão de referência compartilhada para agentes que omitem
  `agents.list[].skills`.
- Omita `agents.defaults.skills` para deixar skills irrestritas por padrão.
- `agents.list[].skills`: conjunto final explícito de skills para esse agente; ele não
  é mesclado com os padrões.
- `agents.list[].skills: []`: não expõe nenhuma skill para esse agente.

## Campos

- As raízes de skills integradas sempre incluem `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: lista de permissão opcional apenas para skills **incluídas**. Quando definida, somente
  skills incluídas na lista são elegíveis (skills gerenciadas, de agente e de workspace não são afetadas).
- `load.extraDirs`: diretórios de skills adicionais a verificar (menor precedência).
- `load.watch`: monitora pastas de skills e atualiza o snapshot de skills (padrão: true).
- `load.watchDebounceMs`: debounce para eventos do monitor de skills em milissegundos (padrão: 250).
- `install.preferBrew`: prefere instaladores brew quando disponíveis (padrão: true).
- `install.nodeManager`: preferência de instalador de node (`npm` | `pnpm` | `yarn` | `bun`, padrão: npm).
  Isso afeta apenas **instalações de skills**; o runtime do Gateway ainda deve ser Node
  (Bun não é recomendado para WhatsApp/Telegram).
  - `openclaw setup --node-manager` é mais restrito e atualmente aceita `npm`,
    `pnpm` ou `bun`. Defina `skills.install.nodeManager: "yarn"` manualmente se você
    quiser instalações de skills baseadas em Yarn.
- `entries.<skillKey>`: substituições por skill.
- `agents.defaults.skills`: lista de permissão de skills padrão opcional herdada por agentes
  que omitem `agents.list[].skills`.
- `agents.list[].skills`: lista de permissão final de skills opcional por agente; listas
  explícitas substituem os padrões herdados em vez de mesclar.

Campos por skill:

- `enabled`: defina `false` para desativar uma skill mesmo que ela esteja incluída/instalada.
- `env`: variáveis de ambiente injetadas na execução do agente (somente se ainda não estiverem definidas).
- `apiKey`: conveniência opcional para skills que declaram uma variável de ambiente primária.
  Aceita string em texto simples ou objeto SecretRef (`{ source, provider, id }`).

## Observações

- Chaves em `entries` mapeiam para o nome da skill por padrão. Se uma skill definir
  `metadata.openclaw.skillKey`, use essa chave em vez disso.
- A precedência de carregamento é `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → skills incluídas →
  `skills.load.extraDirs`.
- Alterações nas skills são captadas no próximo turno do agente quando o monitor está ativado.

### Skills em sandbox e variáveis de ambiente

Quando uma sessão está em **sandbox**, os processos de skills são executados dentro do backend de sandbox configurado. O sandbox **não** herda o `process.env` do host.

<Warning>
  `env` global e `skills.entries.<skill>.env`/`apiKey` se aplicam apenas a execuções no **host**. Dentro de um sandbox, eles não têm efeito, então uma skill que depende de `GEMINI_API_KEY` falhará com `apiKey not configured`, a menos que a variável seja fornecida separadamente ao sandbox.
</Warning>

Use uma destas opções:

- `agents.defaults.sandbox.docker.env` para o backend Docker (ou `agents.list[].sandbox.docker.env` por agente).
- Inclua o env na sua imagem de sandbox customizada ou no ambiente de sandbox remoto.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    O que são skills e como elas são carregadas.
  </Card>
  <Card title="Criação de skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Autoria de pacotes de skills customizados.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos e diretivas de chat.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de `skills` e `agents.skills`.
  </Card>
</CardGroup>
