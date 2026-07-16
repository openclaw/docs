---
read_when:
    - Configurando o carregamento, a instalação ou o controle de acesso de Skills
    - Configurando a visibilidade de Skills por agente
    - Ajuste dos limites ou da política de aprovação do Workshop de Skills
sidebarTitle: Skills config
summary: Referência completa do esquema de configuração `skills.*`, das listas de permissões de agentes, das configurações do workshop e do tratamento de variáveis de ambiente do sandbox.
title: Configuração de Skills
x-i18n:
    generated_at: "2026-07-16T13:01:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

A maior parte da configuração de skills fica em `skills` no
`~/.openclaw/openclaw.json`. A visibilidade específica de cada agente fica em
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
      approvalPolicy: "auto",
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
  junto com a ferramenta principal `image_generate`, em vez de `skills.entries`. As entradas de
  skills destinam-se apenas a fluxos de trabalho de skills personalizados ou de terceiros.
</Note>

## Carregamento (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Diretórios adicionais de skills a serem verificados, com a menor precedência (abaixo das
  skills integradas e de plugins). Os caminhos são expandidos com suporte a `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Diretórios de destino reais e confiáveis para os quais pastas de skills com links simbólicos podem apontar,
  mesmo quando o link simbólico está fora da raiz configurada. Use isso para
  layouts intencionais de repositórios irmãos, como
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantenha esta lista
  restrita — não aponte para raízes amplas como `~` ou `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Monitora as pastas de skills e atualiza o snapshot de skills quando os arquivos `SKILL.md`
  são alterados. Abrange arquivos aninhados em raízes de skills agrupadas.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Janela de debounce, em milissegundos, para eventos do monitor de skills.
</ParamField>

## Instalação (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Prefere instaladores do Homebrew quando `brew` está disponível.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferência de gerenciador de pacotes Node para instalações de skills. Isso afeta apenas as
  instalações de skills — a CLI do OpenClaw e o runtime do Gateway exigem Node porque o
  armazenamento de estado canônico usa `node:sqlite`. `openclaw setup --node-manager` e
  `openclaw onboard --node-manager` aceitam `npm`, `pnpm` ou `bun`; defina
  `"yarn"` diretamente na configuração para instalações de skills que usam Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Permite que clientes confiáveis do Gateway `operator.admin` instalem arquivos zip
  privados preparados por meio de `skills.upload.*`. Instalações normais do ClawHub não
  precisam dessa configuração.
</ParamField>

## Política de instalação do operador (`security.installPolicy`)

Use `security.installPolicy` quando os operadores precisarem de um comando local confiável para
aprovar ou bloquear instalações de skills e plugins com uma política específica do host. A
política é executada depois que o OpenClaw prepara o material de origem e antes que a instalação
ou atualização prossiga. Ela se aplica a skills do ClawHub, skills enviadas, skills do Git/locais,
instaladores de dependências de skills e origens de instalação/atualização de plugins.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omita targets para abranger todos os destinos compatíveis.
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
  Habilita a política de instalação controlada pelo operador. Quando habilitada sem um comando
  `exec` válido, as instalações falham de forma fechada.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro de destino opcional. Quando omitido, a política se aplica a todos os destinos
  compatíveis, para que novas instalações não falhem de forma aberta inesperadamente.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Caminho absoluto para o executável confiável da política. O OpenClaw o executa sem um
  shell e valida o caminho antes do uso.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argumentos estáticos passados depois de `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tempo máximo total de execução para uma decisão de política.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tempo máximo sem saída em stdout ou stderr antes que a política falhe de forma
  fechada.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Máximo de bytes combinados de stdout e stderr aceitos do processo da política.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variáveis de ambiente literais fornecidas ao processo da política.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nomes de variáveis de ambiente copiados do processo do OpenClaw para o
  processo da política. Somente as variáveis nomeadas são repassadas.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Lista de permissões opcional de diretórios que podem conter o executável da política.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Ignora as verificações de propriedade e permissão do caminho do comando. Use somente quando o
  caminho estiver protegido por outro mecanismo.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Permite que o caminho do comando configurado seja um link simbólico. O destino resolvido
  ainda deve atender às demais verificações de caminho. Os argumentos de scripts do interpretador devem
  ser arquivos regulares diretos, não links simbólicos.
</ParamField>

A política recebe um objeto JSON em stdin com `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` estruturado opcional, `origin` estruturado e `request`. Ela deve
gravar um objeto JSON em stdout: `{ "protocolVersion": 1, "decision": "allow" }`
ou `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Código de saída diferente de zero,
tempo limite excedido, JSON malformado, campos ausentes ou versões de protocolo
não compatíveis resultam em falha fechada.

O OpenClaw não executa a política de instalação durante a inicialização normal do Gateway.
As instalações e atualizações falham de forma fechada quando a política está habilitada, mas indisponível.
`openclaw doctor` realiza validação estática; `openclaw doctor --deep`
executa uma sondagem de instalação sintética no comando configurado.

Atualizações em massa aplicam a política por destino: uma atualização de skill ou plugin bloqueada faz
esse destino falhar sem desabilitar a política nem ignorar destinos posteriores no
lote.

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

Comando mínimo de política:

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
        reason: "caminhos locais de plugins não são aprovados neste host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Lista de permissões de skills integradas

<ParamField path="skills.allowBundled" type="string[]">
  Lista de permissões opcional somente para skills **integradas**. Quando definida, apenas as skills integradas
  presentes na lista são elegíveis. Skills gerenciadas, no nível do agente e do espaço de trabalho
  não são afetadas.
</ParamField>

## Entradas por skill (`skills.entries`)

As chaves em `entries` correspondem ao `name` da skill por padrão. Se uma skill definir
`metadata.openclaw.skillKey`, use essa chave em vez disso. Coloque nomes com hífen entre aspas
(JSON5 permite chaves entre aspas).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` desabilita a skill mesmo quando ela é integrada ou está instalada. A
  skill integrada `coding-agent` é opcional — defina-a como `true` e certifique-se de que uma das
  opções `claude`, `codex`, `opencode` ou outra CLI compatível esteja instalada e
  autenticada.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo de conveniência para skills que declaram `metadata.openclaw.primaryEnv`.
  Aceita uma string de texto simples ou uma SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variáveis de ambiente injetadas durante a execução do agente. São injetadas somente quando a
  variável ainda não está definida no processo.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Objeto opcional para campos personalizados de configuração por skill.
</ParamField>

## Listas de permissões de agentes (`agents`)

Use a configuração do agente quando quiser as mesmas raízes de skills da máquina/do espaço de trabalho, mas um
conjunto diferente de skills visíveis por agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // linha de base compartilhada
    },
    list: [
      { id: "writer" }, // herda github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui completamente os padrões
      { id: "locked-down", skills: [] }, // nenhuma skill
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Lista de permissões de referência compartilhada, herdada por agentes que omitem
  `agents.list[].skills`. Omita-a completamente para deixar as skills irrestritas por
  padrão.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Conjunto final explícito de skills para esse agente. Listas explícitas **substituem**
  os padrões herdados — elas não são mescladas. Defina como `[]` para não expor nenhuma skill a
  esse agente.
</ParamField>

<Warning>
  As listas de permissões de skills do agente são um filtro de visibilidade e carregamento para a descoberta de
  skills do OpenClaw, prompts, descoberta de comandos com barra, sincronização do sandbox e
  snapshots de skills. Elas não constituem um limite de autorização durante a execução do shell. Se um agente
  puder executar `exec` no host, esse shell ainda poderá executar clientes externos ou ler
  arquivos do host visíveis ao usuário de execução, incluindo registros de clientes
  MCP, como `~/.openclaw/skills/config/mcporter.json`. Para
  isolamento de MCP por agente, combine listas de permissões de skills com isolamento por sandbox/usuário do SO,
  negue a execução no host ou restrinja-a rigorosamente por uma lista de permissões e prefira credenciais
  por agente no servidor MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Quando `true`, o OpenClaw pode criar propostas pendentes a partir de correções duráveis
  e pode revisar trabalhos concluídos substanciais e bem-sucedidos depois que o sistema ficar
  ocioso. Isso pode adicionar uma execução de modelo em segundo plano após turnos elegíveis. A criação
  de skills solicitada pelo usuário e `/learn` continuam funcionando quando a configuração está `false`.
</ParamField>

Consulte [Autoaprendizado](/tools/self-learning) para ver elegibilidade, privacidade, custo,
permissões somente para propostas e solução de problemas.

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` permite que o agente aplique, rejeite ou coloque em quarentena por iniciativa própria, sem uma
  solicitação adicional de aprovação. `pending` exige aprovação do operador.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Permite que a aplicação do Skill Workshop grave por meio de links simbólicos de skills do workspace cujo
  destino real já seja confiável segundo `skills.load.allowSymlinkTargets`. Mantenha
  isso desabilitado, a menos que a aplicação de propostas geradas deva modificar essa raiz
  compartilhada de skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Número máximo de propostas pendentes e em quarentena mantidas por workspace (intervalo
  permitido: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Tamanho máximo do corpo da proposta em bytes (intervalo permitido: 1024-200000). As
  descrições das propostas têm um limite rígido separado de 160 bytes, pois aparecem
  na saída de descoberta e listagem.
</ParamField>

Consulte [Skill Workshop](/pt-BR/tools/skill-workshop) para ver o ciclo de vida das propostas, os comandos da CLI,
os parâmetros de ferramentas do agente e os métodos do Gateway controlados por esta configuração.

## Raízes de skills com links simbólicos

Por padrão, as raízes de skills do workspace, do agente do projeto, de diretórios extras e de skills incluídas são
limites de contenção. Uma pasta de skill com link simbólico em `<workspace>/skills`
que seja resolvida fora da raiz é ignorada com uma mensagem de log.

Para permitir intencionalmente um layout com links simbólicos, declare o destino confiável:

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
é aceito após a resolução do caminho real. `extraDirs` verifica diretamente o repositório
irmão; `allowSymlinkTargets` preserva o caminho com link simbólico para layouts
existentes.

Por padrão, a aplicação do Skill Workshop não grava por meio desses links simbólicos. Para
permitir que a aplicação do Workshop modifique skills em destinos de links simbólicos já confiáveis, habilite
essa opção separadamente:

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

Os diretórios gerenciados `~/.openclaw/skills` e pessoais `~/.agents/skills`
já aceitam incondicionalmente links simbólicos para diretórios de skills (a contenção de
`SKILL.md` por skill ainda se aplica) — `allowSymlinkTargets` só é necessário
para raízes do workspace, de diretórios extras e do agente do projeto (`<workspace>/.agents/skills`).

## Skills em sandbox e variáveis de ambiente

<Warning>
  `skills.entries.<skill>.env` e `apiKey` se aplicam somente a execuções no **host**.
  Dentro de uma sandbox, eles não têm efeito — uma skill que dependa de
  `GEMINI_API_KEY` falhará com `apiKey not configured`, a menos que a variável seja
  fornecida separadamente à sandbox.
</Warning>

Passe segredos para uma sandbox do Docker com:

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
  Usuários com acesso ao daemon do Docker podem inspecionar os valores de `sandbox.docker.env`
  por meio dos metadados do Docker. Use um arquivo de segredo montado, uma imagem personalizada ou
  outro meio de fornecimento quando essa exposição não for aceitável.
</Note>

## Lembrete da ordem de carregamento

```text
workspace/skills      (mais alta)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
skills incluídas
skills.load.extraDirs (mais baixa)
```

As alterações em skills e na configuração entram em vigor na próxima sessão nova quando o
observador está habilitado, ou no próximo turno do agente quando o observador detecta uma
alteração.

## Relacionados

<CardGroup cols={2}>
  <Card title="Referência de skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    O que são skills, ordem de carregamento, restrições e formato de SKILL.md.
  </Card>
  <Card title="Criação de skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Criação de skills personalizadas para o workspace.
  </Card>
  <Card title="Skill Workshop" href="/pt-BR/tools/skill-workshop" icon="flask">
    Fila de propostas para skills elaboradas pelo agente.
  </Card>
  <Card title="Autoaprendizado" href="/tools/self-learning" icon="brain">
    Propostas conservadoras e opcionais provenientes de trabalhos concluídos.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo nativo de comandos de barra e diretivas de chat.
  </Card>
</CardGroup>
