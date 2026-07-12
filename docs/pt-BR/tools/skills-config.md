---
read_when:
    - Configurando o carregamento, a instalação ou o controle de acesso de Skills
    - Configurando a visibilidade de Skills por agente
    - Ajustando os limites ou a política de aprovação do Skill Workshop
sidebarTitle: Skills config
summary: Referência completa do esquema de configuração `skills.*`, das listas de permissões de agentes, das configurações do workshop e do tratamento de variáveis de ambiente do sandbox.
title: Configuração de Skills
x-i18n:
    generated_at: "2026-07-12T00:29:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

A maior parte da configuração de Skills fica em `skills` no arquivo
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
  Para a geração de imagens integrada, use `agents.defaults.imageGenerationModel`
  junto com a ferramenta principal `image_generate`, em vez de `skills.entries`. As
  entradas de Skills destinam-se apenas a fluxos de trabalho personalizados ou de
  terceiros.
</Note>

## Carregamento (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Diretórios adicionais de Skills a serem verificados, com a menor precedência
  (abaixo das Skills integradas e de Plugins). Os caminhos são expandidos com
  suporte a `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Diretórios de destino reais e confiáveis para os quais pastas de Skills
  vinculadas simbolicamente podem apontar, mesmo quando o link simbólico está fora
  da raiz configurada. Use isso para layouts intencionais de repositórios irmãos,
  como `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantenha esta
  lista restrita — não aponte para raízes amplas como `~` ou `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Monitora as pastas de Skills e atualiza o snapshot de Skills quando arquivos
  `SKILL.md` são alterados. Abrange arquivos aninhados em raízes de Skills
  agrupadas.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Janela de debounce, em milissegundos, para eventos do monitor de Skills.
</ParamField>

## Instalação (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Dá preferência aos instaladores do Homebrew quando `brew` está disponível.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferência de gerenciador de pacotes do Node para instalações de Skills. Isso
  afeta apenas as instalações de Skills — o ambiente de execução do Gateway ainda
  deve usar Node (Bun não é recomendado para WhatsApp/Telegram).
  `openclaw setup --node-manager` e `openclaw onboard --node-manager` aceitam
  `npm`, `pnpm` ou `bun`; defina `"yarn"` diretamente na configuração para
  instalações de Skills baseadas em Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Permite que clientes confiáveis do Gateway com `operator.admin` instalem
  arquivos zip privados preparados por meio de `skills.upload.*`. Instalações
  normais do ClawHub não precisam dessa configuração.
</ParamField>

## Política de instalação do operador (`security.installPolicy`)

Use `security.installPolicy` quando os operadores precisarem de um comando local
confiável para aprovar ou bloquear instalações de Skills e Plugins com uma
política específica do host. A política é executada depois que o OpenClaw prepara
o material de origem e antes que a instalação ou atualização prossiga. Ela se
aplica a Skills do ClawHub, Skills enviadas, Skills do Git/locais, instaladores
de dependências de Skills e origens de instalação/atualização de Plugins.

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
  Ativa a política de instalação controlada pelo operador. Quando ativada sem
  um comando `exec` válido, as instalações falham de forma segura.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro opcional de destinos. Quando omitido, a política se aplica a todos os
  destinos compatíveis, para que novas instalações não sejam permitidas
  inesperadamente em caso de falha.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Caminho absoluto para o executável confiável da política. O OpenClaw o executa
  sem um shell e valida o caminho antes do uso.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argumentos estáticos passados após `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tempo máximo total de execução para uma decisão da política.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tempo máximo sem saída em stdout ou stderr antes que a política falhe de forma
  segura.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Número máximo combinado de bytes de stdout e stderr aceitos do processo da
  política.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variáveis de ambiente literais fornecidas ao processo da política.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nomes de variáveis de ambiente copiados do processo do OpenClaw para o processo
  da política. Apenas as variáveis nomeadas são repassadas.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Lista opcional de diretórios permitidos que podem conter o executável da
  política.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Ignora as verificações de propriedade e permissões do caminho do comando. Use
  somente quando o caminho estiver protegido por outro mecanismo.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Permite que o caminho configurado do comando seja um link simbólico. O destino
  resolvido ainda precisa atender às demais verificações de caminho. Os argumentos
  de scripts de interpretador devem ser arquivos regulares diretos, não links
  simbólicos.
</ParamField>

A política recebe um objeto JSON em stdin com `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` estruturado opcional, `origin` estruturado e `request`. Ela deve
escrever um objeto JSON em stdout: `{ "protocolVersion": 1, "decision": "allow" }`
ou `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Código de
saída diferente de zero, tempo limite, JSON malformado, campos ausentes ou versões
de protocolo não compatíveis causam falha segura.

O OpenClaw não executa a política de instalação durante a inicialização normal
do Gateway. Instalações e atualizações falham de forma segura quando a política
está ativada, mas indisponível. `openclaw doctor` executa uma validação estática;
`openclaw doctor --deep` executa uma sondagem sintética de instalação usando o
comando configurado.

Atualizações em massa aplicam a política a cada destino: uma atualização de Skill
ou Plugin bloqueada causa falha nesse destino sem desativar a política nem ignorar
os destinos posteriores do lote.

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
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Lista de permissões de Skills integradas

<ParamField path="skills.allowBundled" type="string[]">
  Lista de permissões opcional apenas para Skills **integradas**. Quando definida,
  somente as Skills integradas presentes na lista são elegíveis. Skills
  gerenciadas, no nível do agente e do workspace não são afetadas.
</ParamField>

## Entradas por Skill (`skills.entries`)

Por padrão, as chaves em `entries` correspondem ao `name` da Skill. Se uma Skill
definir `metadata.openclaw.skillKey`, use essa chave. Coloque nomes com hífen
entre aspas (JSON5 permite chaves entre aspas).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` desativa a Skill mesmo quando ela está integrada ou instalada. A Skill
  integrada `coding-agent` exige ativação explícita — defina-a como `true` e
  certifique-se de que `claude`, `codex`, `opencode` ou outra CLI compatível esteja
  instalada e autenticada.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo de conveniência para Skills que declaram `metadata.openclaw.primaryEnv`.
  Aceita uma string de texto simples ou uma SecretRef:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variáveis de ambiente injetadas durante a execução do agente. São injetadas
  somente quando a variável ainda não está definida no processo.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Objeto opcional para campos personalizados de configuração por Skill.
</ParamField>

## Listas de permissões de agentes (`agents`)

Use a configuração do agente quando quiser manter as mesmas raízes de Skills da
máquina/workspace, mas usar um conjunto diferente de Skills visíveis para cada
agente.

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
  Lista de permissões de referência compartilhada, herdada por agentes que omitem
  `agents.list[].skills`. Omita-a por completo para deixar as Skills sem
  restrições por padrão.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Conjunto final explícito de Skills para esse agente. Listas explícitas
  **substituem** os padrões herdados — elas não são combinadas. Defina como `[]`
  para não expor nenhuma Skill a esse agente.
</ParamField>

<Warning>
  As listas de permissões de Skills dos agentes são um filtro de visibilidade e
  carregamento para a descoberta de Skills pelo OpenClaw, prompts, descoberta de
  comandos de barra, sincronização do sandbox e snapshots de Skills. Elas não são
  um limite de autorização no momento da execução do shell. Se um agente puder
  executar `exec` no host, esse shell ainda poderá executar clientes externos ou
  ler arquivos do host visíveis para o usuário de execução, incluindo registros
  de clientes MCP, como `~/.openclaw/skills/config/mcporter.json`. Para isolamento
  de MCP por agente, combine listas de permissões de Skills com isolamento por
  sandbox/usuário do sistema operacional, negue ou restrinja rigorosamente
  `exec` no host por meio de uma lista de permissões e prefira credenciais
  específicas por agente no servidor MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Quando `true`, os agentes podem criar propostas pendentes com base em sinais
  persistentes de conversas após turnos bem-sucedidos. A criação de Skills
  solicitada pelo usuário sempre passa pelo Skill Workshop,
  independentemente desta configuração.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` exige a aprovação do operador antes que ações de aplicar, rejeitar
  ou colocar em quarentena sejam iniciadas pelo agente. `auto` permite essas
  ações sem aprovação.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Permite que a aplicação pelo Skill Workshop grave por meio de links
  simbólicos de Skills do espaço de trabalho cujo destino real já seja
  confiável conforme `skills.load.allowSymlinkTargets`. Mantenha esta opção
  desativada, a menos que a aplicação das propostas geradas deva modificar
  essa raiz compartilhada de Skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Número máximo de propostas pendentes e em quarentena mantidas por espaço de
  trabalho (intervalo permitido: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Tamanho máximo do corpo da proposta em bytes (intervalo permitido:
  1024-200000). As descrições das propostas têm um limite rígido separado de
  160 bytes, pois aparecem na saída de descoberta e listagem.
</ParamField>

Consulte [Skill Workshop](/pt-BR/tools/skill-workshop) para conhecer o ciclo de vida
das propostas, os comandos da CLI, os parâmetros das ferramentas do agente e
os métodos do Gateway controlados por esta configuração.

## Raízes de Skills com links simbólicos

Por padrão, as raízes de Skills do espaço de trabalho, do agente do projeto,
de diretórios extras e das Skills integradas são limites de contenção. Uma
pasta de Skill com link simbólico em `<workspace>/skills` que seja resolvida
para fora da raiz é ignorada e uma mensagem é registrada no log.

Para permitir intencionalmente uma estrutura com links simbólicos, declare o
destino confiável:

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
é aceito após a resolução do caminho real. `extraDirs` verifica diretamente o
repositório adjacente; `allowSymlinkTargets` preserva o caminho com link
simbólico para estruturas existentes.

Por padrão, a aplicação pelo Skill Workshop não grava por meio desses links
simbólicos. Para permitir que a aplicação pelo Workshop modifique Skills em
destinos de links simbólicos já confiáveis, habilite essa opção separadamente:

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
já aceitam incondicionalmente links simbólicos para diretórios de Skills (a
contenção de `SKILL.md` por Skill ainda se aplica) — `allowSymlinkTargets` só
é necessário para as raízes do espaço de trabalho, de diretórios extras e do
agente do projeto (`<workspace>/.agents/skills`).

## Skills em sandbox e variáveis de ambiente

<Warning>
  `skills.entries.<skill>.env` e `apiKey` se aplicam somente a execuções no
  **host**. Dentro de uma sandbox, eles não têm efeito — uma Skill que dependa
  de `GEMINI_API_KEY` falhará com `apiKey not configured`, a menos que a
  variável seja fornecida separadamente à sandbox.
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
  Usuários com acesso ao daemon do Docker podem inspecionar os valores de
  `sandbox.docker.env` por meio dos metadados do Docker. Use um arquivo de
  segredo montado, uma imagem personalizada ou outro meio de fornecimento
  quando essa exposição não for aceitável.
</Note>

## Lembrete da ordem de carregamento

```text
workspace/skills      (mais alta)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
Skills integradas
skills.load.extraDirs (mais baixa)
```

As alterações nas Skills e na configuração entram em vigor na próxima nova
sessão quando o monitor estiver habilitado, ou no próximo turno do agente
quando o monitor detectar uma alteração.

## Relacionados

<CardGroup cols={2}>
  <Card title="Referência de Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    O que são Skills, ordem de carregamento, restrições e formato de SKILL.md.
  </Card>
  <Card title="Criação de Skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Criação de Skills personalizadas para o espaço de trabalho.
  </Card>
  <Card title="Skill Workshop" href="/pt-BR/tools/skill-workshop" icon="flask">
    Fila de propostas para Skills elaboradas por agentes.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo nativo de comandos de barra e diretivas de chat.
  </Card>
</CardGroup>
