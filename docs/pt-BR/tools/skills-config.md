---
read_when:
    - Configurando o carregamento, a instalação ou o comportamento de controle de Skills
    - Definindo a visibilidade de Skills por agente
    - Ajustando os limites ou a política de aprovação do Skill Workshop
sidebarTitle: Skills config
summary: Referência completa para o esquema de configuração `skills.*`, listas de permissões de agentes, configurações de workshop e tratamento de variáveis de ambiente do sandbox.
title: Configuração de Skills
x-i18n:
    generated_at: "2026-07-01T05:35:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

A maior parte da configuração de skills fica em `skills` em
`~/.openclaw/openclaw.json`. A visibilidade específica do agente fica em
`agents.defaults.skills` e `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Para geração de imagens integrada, use `agents.defaults.imageGenerationModel`
  mais a ferramenta central `image_generate` em vez de `skills.entries`. Entradas
  de skill são apenas para fluxos de trabalho de skills personalizados ou de terceiros.
</Note>

## Carregamento (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Diretórios adicionais de skills a verificar, com a menor precedência (depois de skills
  empacotadas e de Plugin). Os caminhos são expandidos com suporte a `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Diretórios de destino reais confiáveis para os quais pastas de skills com symlink podem resolver,
  mesmo quando o symlink fica fora da raiz configurada. Use isto para
  layouts intencionais de repositórios irmãos, como
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantenha esta lista
  restrita — não aponte para raízes amplas como `~` ou `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Observa pastas de skills e atualiza o snapshot de skills quando arquivos `SKILL.md`
  mudam. Abrange arquivos aninhados em raízes de skills agrupadas.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Janela de debounce para eventos do observador de skills, em milissegundos.
</ParamField>

## Instalação (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Prefere instaladores do Homebrew quando `brew` está disponível.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferência de gerenciador de pacotes Node para instalações de skills. Isto afeta apenas
  instalações de skills — o runtime do Gateway ainda deve usar Node (Bun não é recomendado
  para WhatsApp/Telegram). Use `openclaw setup --node-manager` para npm, pnpm
  ou bun; defina `"yarn"` manualmente para instalações de skills baseadas em Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Permite que clientes Gateway `operator.admin` confiáveis instalem arquivos zip
  privados preparados por meio de `skills.upload.*`. Instalações normais do ClawHub não
  precisam desta configuração.
</ParamField>

## Política de instalação do operador (`security.installPolicy`)

Use `security.installPolicy` quando operadores precisarem de um comando local confiável para
aprovar ou bloquear instalações de skills e plugins com uma política específica do host. A política
é executada depois que o OpenClaw preparou o material de origem e antes que a instalação ou atualização
continue. Ela se aplica a skills do ClawHub, skills enviadas, skills Git/locais,
instaladores de dependências de skills e origens de instalação/atualização de plugins.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Habilita a política de instalação controlada pelo operador. Quando habilitada sem um comando `exec`
  válido, as instalações falham de forma fechada.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro de alvo opcional. Quando omitido, a política se aplica a todos os alvos compatíveis
  para que novas instalações não falhem abertas inesperadamente.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Caminho absoluto para o executável de política confiável. O OpenClaw o executa sem um
  shell e valida o caminho antes do uso.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argumentos estáticos passados depois de `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tempo máximo de execução em relógio de parede para uma decisão de política.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tempo máximo sem saída em stdout ou stderr antes que a política falhe de forma fechada.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Máximo de bytes combinados de stdout e stderr aceitos do processo de política.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variáveis de ambiente literais fornecidas ao processo de política.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nomes de variáveis de ambiente copiados do processo do OpenClaw para o processo de
  política. Apenas variáveis nomeadas são passadas.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Lista de permissões opcional de diretórios que podem conter o executável de política.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Ignora verificações de propriedade e permissão do caminho do comando. Use apenas quando o caminho
  estiver protegido por outro mecanismo.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Permite que o caminho de comando configurado seja um symlink. O destino resolvido ainda deve
  satisfazer as outras verificações de caminho. Argumentos de scripts interpretadores devem ser
  arquivos regulares diretos, não symlinks.
</ParamField>

A política recebe um objeto JSON em stdin com `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` estruturado opcional, `origin` estruturado e `request`. Ela deve escrever
um objeto JSON em stdout: `{ "protocolVersion": 1, "decision": "allow" }` ou
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Saída diferente de zero,
timeout, JSON malformado, campos ausentes ou versões de protocolo sem suporte
falham de forma fechada.

O OpenClaw não executa a política de instalação durante a inicialização normal do Gateway. Instalações
e atualizações falham de forma fechada quando a política está habilitada, mas indisponível. `openclaw doctor`
realiza validação estática, e `openclaw doctor --deep` executa uma sondagem sintética
de instalação contra o comando configurado.

Atualizações em massa aplicam a política por alvo: uma atualização de skill ou plugin bloqueada falha
nesse alvo sem desabilitar a política nem pular alvos posteriores no lote.

Exemplo de stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Comando de política mínimo:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Lista de permissões de skills empacotadas

<ParamField path="skills.allowBundled" type="string[]">
  Lista de permissões opcional apenas para skills **empacotadas**. Quando definida, apenas skills empacotadas
  na lista ficam elegíveis. Skills gerenciadas, no nível do agente e do workspace
  não são afetadas.
</ParamField>

## Entradas por skill (`skills.entries`)

Chaves em `entries` correspondem ao `name` da skill por padrão. Se uma skill definir
`metadata.openclaw.skillKey`, use essa chave em vez disso. Coloque nomes com hífen entre aspas
(JSON5 permite chaves entre aspas).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` desabilita a skill mesmo quando ela está empacotada ou instalada. A skill empacotada `coding-agent`
  é opt-in — defina-a como `true` e garanta que `claude`,
  `codex`, `opencode` ou outra CLI compatível esteja instalada e autenticada.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo de conveniência para skills que declaram `metadata.openclaw.primaryEnv`.
  Aceita uma string em texto simples ou um SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variáveis de ambiente injetadas para a execução do agente. Injetadas apenas quando a
  variável ainda não está definida no processo.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Bolsa opcional para campos personalizados de configuração por skill.
</ParamField>

## Listas de permissões de agentes (`agents`)

Use a configuração do agente quando quiser as mesmas raízes de skills de máquina/workspace, mas um
conjunto de skills visível diferente por agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Lista de permissões de linha de base compartilhada herdada por agentes que omitem `agents.list[].skills`.
  Omita por completo para deixar skills irrestritas por padrão.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Conjunto final explícito de skills para esse agente. Listas explícitas **substituem** padrões
  herdados — elas não são mescladas. Defina como `[]` para não expor skills a esse agente.
</ParamField>

<Warning>
  Listas de permissões de skills de agentes são um filtro de visibilidade e carregamento para a descoberta de skills do OpenClaw,
  prompts, descoberta de comandos de barra, sincronização de sandbox e
  snapshots de skills. Elas não são uma fronteira de autorização em tempo de shell. Se um agente puder
  executar `exec` no host, esse shell ainda poderá executar clientes externos ou ler arquivos do host
  que estejam visíveis ao usuário de execução, incluindo registros de clientes MCP, como
  `~/.openclaw/skills/config/mcporter.json`. Para isolamento MCP por agente,
  combine listas de permissões de skills com isolamento por sandbox/usuário do SO, negue ou restrinja fortemente
  `exec` no host e prefira credenciais por agente no servidor MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Quando `true`, agentes podem criar propostas pendentes a partir de sinais duráveis de conversa
  após turnos bem-sucedidos. A criação de skills solicitada pelo usuário sempre passa
  pelo Skill Workshop, independentemente desta configuração.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` exige aprovação do operador antes de aplicar, rejeitar ou colocar em
  quarentena por iniciativa do agente. `auto` permite essas ações sem aprovação.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Permite que a aplicação do Skill Workshop grave por meio de links simbólicos
  de skills do workspace cujo destino real já é confiável por
  `skills.load.allowSymlinkTargets`. Mantenha isto desabilitado, a menos que
  aplicações de propostas geradas devam modificar essa raiz de skills
  compartilhada.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Máximo de propostas pendentes e em quarentena retidas por workspace.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Tamanho máximo do corpo da proposta em bytes. As descrições de propostas têm
  limite rígido de 160 bytes porque aparecem na saída de descoberta e listagem.
</ParamField>

## Raízes de skills com links simbólicos

Por padrão, raízes de skills de workspace, agente de projeto, diretório extra e
incluídas são limites de contenção. Uma pasta de skill com link simbólico em
`<workspace>/skills` que resolve para fora da raiz é ignorada com uma mensagem
de log.

Para permitir um layout intencional com link simbólico, declare o destino
confiável:

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

Com esta configuração, `<workspace>/skills/manager -> ~/Projects/manager/skills`
é aceito após a resolução de realpath. `extraDirs` verifica diretamente o
repositório irmão; `allowSymlinkTargets` preserva o caminho com link simbólico
para layouts existentes.

Por padrão, a aplicação do Skill Workshop não grava por meio desses links
simbólicos. Para permitir que a aplicação do Workshop modifique skills em
destinos de links simbólicos já confiáveis, habilite separadamente:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Diretórios gerenciados `~/.openclaw/skills` e diretórios pessoais
`~/.agents/skills` já aceitam links simbólicos para diretórios de skills (a
contenção por skill de `SKILL.md` ainda se aplica).

## Skills em sandbox e variáveis de ambiente

<Warning>
  `skills.entries.<skill>.env` e `apiKey` se aplicam apenas a execuções no
  **host**. Dentro de um sandbox, eles não têm efeito — uma skill que depende de
  `GEMINI_API_KEY` falhará com `apiKey not configured`, a menos que o sandbox
  receba a variável separadamente.
</Warning>

Passe segredos para um sandbox Docker com:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Usuários com acesso ao daemon do Docker podem inspecionar valores de
  `sandbox.docker.env` por meio dos metadados do Docker. Use um arquivo de
  segredo montado, uma imagem personalizada ou outro caminho de entrega quando
  essa exposição não for aceitável.
</Note>

## Lembrete da ordem de carregamento

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Alterações em skills e na configuração entram em vigor na próxima nova sessão
quando o observador está habilitado, ou no próximo turno do agente quando o
observador detecta uma alteração.

## Relacionados

<CardGroup cols={2}>
  <Card title="Referência de Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    O que são skills, ordem de carregamento, controles de acesso e formato de SKILL.md.
  </Card>
  <Card title="Criando skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Autoria de skills personalizadas de workspace.
  </Card>
  <Card title="Skill Workshop" href="/pt-BR/tools/skill-workshop" icon="flask">
    Fila de propostas para skills rascunhadas por agentes.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo nativo de comandos de barra e diretivas de chat.
  </Card>
</CardGroup>
