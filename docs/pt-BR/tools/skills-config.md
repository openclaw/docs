---
read_when:
    - Adicionar ou modificar a configuração de Skills
    - Ajustando a lista de permissões integrada ou o comportamento de instalação
summary: Esquema de configuração e exemplos de Skills
title: Configuração de Skills
x-i18n:
    generated_at: "2026-05-10T19:53:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

A maior parte da configuração de carregamento/instalação de Skills fica em `skills` em
`~/.openclaw/openclaw.json`. A visibilidade de Skills específica do agente fica em
`agents.defaults.skills` e `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
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
mais a ferramenta principal `image_generate`. `skills.entries.*` é apenas para fluxos de trabalho
de Skills personalizados ou de terceiros.

Se você selecionar um provedor/modelo de imagem específico, configure também a chave de
autenticação/API desse provedor. Exemplos típicos: `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para
`google/*`, `OPENAI_API_KEY` para `openai/*` e `FAL_KEY` para `fal/*`.

Exemplos:

- Configuração nativa no estilo Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuração nativa da fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listas de permissões de Skills do agente

Use a configuração do agente quando quiser as mesmas raízes de Skills na máquina/workspace,
mas um conjunto de Skills visível diferente por agente.

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

- `agents.defaults.skills`: lista de permissões de referência compartilhada para agentes que omitem
  `agents.list[].skills`.
- Omita `agents.defaults.skills` para deixar Skills irrestritas por padrão.
- `agents.list[].skills`: conjunto final explícito de Skills para esse agente; ele não
  é mesclado com os padrões.
- `agents.list[].skills: []`: não expõe nenhuma Skill para esse agente.

## Campos

- As raízes de Skills integradas sempre incluem `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` e `<workspace>/skills`.
- `allowBundled`: lista de permissões opcional apenas para Skills **incluídas**. Quando definida, somente
  as Skills incluídas na lista são elegíveis (Skills gerenciadas, de agente e de workspace não são afetadas).
- `load.extraDirs`: diretórios adicionais de Skills para varrer (menor precedência).
- `load.allowSymlinkTargets`: diretórios de destino reais confiáveis nos quais pastas de
  Skills com symlink podem resolver, mesmo quando o symlink fica fora dessa
  raiz de destino. Use isto para layouts intencionais de repositórios irmãos, como
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch`: observa pastas de Skills e atualiza o snapshot de Skills (padrão: true).
- `load.watchDebounceMs`: debounce para eventos do observador de Skills em milissegundos (padrão: 250).
- `install.preferBrew`: prefere instaladores brew quando disponíveis (padrão: true).
- `install.nodeManager`: preferência de instalador node (`npm` | `pnpm` | `yarn` | `bun`, padrão: npm).
  Isso afeta apenas **instalações de Skills**; o runtime do Gateway ainda deve ser Node
  (Bun não é recomendado para WhatsApp/Telegram).
  - `openclaw setup --node-manager` é mais restrito e atualmente aceita `npm`,
    `pnpm` ou `bun`. Defina `skills.install.nodeManager: "yarn"` manualmente se você
    quiser instalações de Skills com Yarn.
- `install.allowUploadedArchives`: permite que clientes Gateway confiáveis `operator.admin`
  instalem arquivos zip privados preparados por meio de `skills.upload.*`
  (padrão: false). Isso habilita apenas o caminho de arquivo enviado; instalações normais do ClawHub
  não precisam disso.
- `entries.<skillKey>`: substituições por Skill.
- `agents.defaults.skills`: lista de permissões padrão opcional de Skills herdada por agentes
  que omitem `agents.list[].skills`.
- `agents.list[].skills`: lista de permissões final opcional de Skills por agente; listas explícitas
  substituem os padrões herdados em vez de mesclar.

## Repositórios irmãos com symlink

Por padrão, cada raiz de Skills é um limite de contenção. Se uma pasta de Skill em
`~/.agents/skills` for um symlink que resolve fora de `~/.agents/skills`,
o OpenClaw a ignora e registra `Skipping escaped skill path outside its configured
root`.

Mantenha o layout de symlink e permita apenas a raiz de destino confiável:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Com essa configuração, um symlink como
`~/.agents/skills/manager -> ~/Projects/manager/skills` é aceito após a
resolução de realpath. `extraDirs` também varre diretamente o repositório irmão, enquanto
`allowSymlinkTargets` preserva o caminho com symlink para layouts existentes de Skills
de agente. Mantenha as entradas de destino restritas; não aponte para raízes amplas como `~` ou
`~/Projects`, a menos que toda árvore de Skills sob essa raiz seja confiável.

Campos por Skill:

- `enabled`: defina como `false` para desabilitar uma Skill mesmo que ela esteja incluída/instalada.
- `env`: variáveis de ambiente injetadas para a execução do agente (somente se ainda não estiverem definidas).
- `apiKey`: conveniência opcional para Skills que declaram uma variável de ambiente principal.
  Aceita string em texto puro ou objeto SecretRef (`{ source, provider, id }`).

## Observações

- As chaves em `entries` mapeiam para o nome da Skill por padrão. Se uma Skill definir
  `metadata.openclaw.skillKey`, use essa chave em vez disso.
- A precedência de carregamento é `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills incluídas →
  `skills.load.extraDirs`.
- Alterações em Skills são captadas no próximo turno do agente quando o observador está habilitado.

### Skills em sandbox e variáveis de ambiente

Quando uma sessão está em **sandbox**, os processos de Skills são executados dentro do backend de sandbox configurado. A sandbox **não** herda o `process.env` do host.

<Warning>
  `env` global e `skills.entries.<skill>.env`/`apiKey` se aplicam apenas a execuções no **host**. Dentro de uma sandbox, eles não têm efeito, então uma Skill que depende de `GEMINI_API_KEY` falhará com `apiKey not configured`, a menos que a variável seja fornecida separadamente à sandbox.
</Warning>

Use uma das opções:

- `agents.defaults.sandbox.docker.env` para o backend Docker (ou `agents.list[].sandbox.docker.env` por agente).
- Inclua o env na sua imagem de sandbox personalizada ou no ambiente de sandbox remoto.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    O que são Skills e como elas são carregadas.
  </Card>
  <Card title="Criação de Skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Autoria de pacotes de Skills personalizados.
  </Card>
  <Card title="Comandos slash" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos e diretivas de chat.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de `skills` e `agents.skills`.
  </Card>
</CardGroup>
