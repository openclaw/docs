---
read_when:
    - Configurando o comportamento de carregamento, instalação ou controle de acesso de Skills
    - Configurando a visibilidade de Skills por agente
    - Ajustando os limites ou a política de aprovação do Skill Workshop
sidebarTitle: Skills config
summary: Referência completa para o esquema de configuração skills.*, allowlists de agentes, configurações de workshop e tratamento de variáveis de ambiente do sandbox.
title: Configuração de Skills
x-i18n:
    generated_at: "2026-06-27T18:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

A maior parte da configuração de Skills fica em `skills` em
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
  junto com a ferramenta central `image_generate` em vez de `skills.entries`. As
  entradas de Skills são apenas para fluxos de trabalho de Skills customizados
  ou de terceiros.
</Note>

## Carregamento (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Diretórios adicionais de Skills a verificar, na precedência mais baixa (depois
  de Skills incluídas e de Plugin). Os caminhos são expandidos com suporte a `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Diretórios de destino reais e confiáveis para os quais pastas de Skills com
  symlink podem resolver, mesmo quando o symlink fica fora da raiz configurada.
  Use isto para layouts intencionais de repositórios irmãos, como
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantenha esta lista
  restrita; não aponte para raízes amplas como `~` ou `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Observa pastas de Skills e atualiza o snapshot de Skills quando arquivos
  `SKILL.md` mudam. Abrange arquivos aninhados sob raízes agrupadas de Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Janela de debounce para eventos do observador de Skills, em milissegundos.
</ParamField>

## Instalação (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Prefere instaladores Homebrew quando `brew` está disponível.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferência de gerenciador de pacotes Node para instalações de Skills. Isto
  afeta apenas instalações de Skills; o runtime do Gateway ainda deve usar Node
  (Bun não é recomendado para WhatsApp/Telegram). Use `openclaw setup --node-manager`
  para npm, pnpm ou bun; defina `"yarn"` manualmente para instalações de Skills
  baseadas em Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Permite que clientes Gateway confiáveis `operator.admin` instalem arquivos zip
  privados preparados por meio de `skills.upload.*`. Instalações normais do
  ClawHub não precisam desta configuração.
</ParamField>

## Política de Instalação do Operador (`security.installPolicy`)

Use `security.installPolicy` quando operadores precisarem de um comando local
confiável para aprovar ou bloquear instalações de Skills e Plugins com política
específica do host. A política é executada depois que o OpenClaw preparou o
material de origem e antes que a instalação ou atualização continue. Ela se
aplica a Skills do ClawHub, Skills enviadas por upload, Skills Git/locais,
instaladores de dependências de Skills e origens de instalação/atualização de
Plugins.

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
  Habilita a política de instalação pertencente ao operador. Quando habilitada
  sem um comando `exec` válido, as instalações falham de forma fechada.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro de destino opcional. Quando omitido, a política se aplica a todos os
  destinos compatíveis para que novas instalações não falhem inesperadamente de
  forma aberta.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Caminho absoluto para o executável de política confiável. O OpenClaw o executa
  sem shell e valida o caminho antes do uso.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argumentos estáticos passados após `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tempo máximo de execução em tempo real para uma decisão de política.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tempo máximo sem saída stdout ou stderr antes que a política falhe de forma fechada.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Máximo de bytes combinados de stdout e stderr aceitos do processo de política.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variáveis de ambiente literais fornecidas ao processo de política.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nomes de variáveis de ambiente copiados do processo do OpenClaw para o processo
  de política. Somente variáveis nomeadas são passadas.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Lista de permissões opcional de diretórios que podem conter o executável de política.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Ignora verificações de propriedade e permissão do caminho do comando. Use
  apenas quando o caminho estiver protegido por outro mecanismo.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Permite que o caminho de comando configurado seja um symlink. O destino
  resolvido ainda deve satisfazer as outras verificações de caminho. Argumentos
  de script de interpretador devem ser arquivos regulares diretos, não symlinks.
</ParamField>

A política recebe um objeto JSON em stdin com `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` estruturado opcional, `origin` estruturado e `request`. Ela deve escrever
um objeto JSON em stdout: `{ "protocolVersion": 1, "decision": "allow" }` ou
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Saída diferente
de zero, timeout, JSON malformado, campos ausentes ou versões de protocolo sem
suporte falham de forma fechada.

O OpenClaw não executa a política de instalação durante a inicialização normal do
Gateway. Instalações e atualizações falham de forma fechada quando a política
está habilitada, mas indisponível. `openclaw doctor` executa validação estática,
e `openclaw doctor --deep` executa uma sondagem sintética de instalação contra o
comando configurado.

Atualizações em lote aplicam a política por destino: uma atualização de Skill ou
Plugin bloqueada falha naquele destino sem desabilitar a política nem pular
destinos posteriores no lote.

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

## Lista de permissões de Skills incluídas

<ParamField path="skills.allowBundled" type="string[]">
  Lista de permissões opcional apenas para Skills **incluídas**. Quando definida,
  somente Skills incluídas na lista são elegíveis. Skills gerenciadas, de nível
  de agente e de workspace não são afetadas.
</ParamField>

## Entradas por Skill (`skills.entries`)

Chaves em `entries` correspondem ao `name` da Skill por padrão. Se uma Skill
definir `metadata.openclaw.skillKey`, use essa chave em vez disso. Coloque nomes
com hífen entre aspas (JSON5 permite chaves entre aspas).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` desabilita a Skill mesmo quando incluída ou instalada. A Skill incluída
  `coding-agent` é opt-in; defina-a como `true` e garanta que uma das CLIs
  `claude`, `codex`, `opencode` ou outra compatível esteja instalada e autenticada.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo de conveniência para Skills que declaram `metadata.openclaw.primaryEnv`.
  Aceita uma string em texto claro ou um SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variáveis de ambiente injetadas para a execução do agente. Injetadas somente
  quando a variável ainda não está definida no processo.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Contêiner opcional para campos de configuração customizados por Skill.
</ParamField>

## Listas de permissões de agentes (`agents`)

Use a configuração de agente quando você quiser as mesmas raízes de Skills da
máquina/workspace, mas um conjunto de Skills visível diferente por agente.

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
  Lista de permissões base compartilhada herdada por agentes que omitem
  `agents.list[].skills`. Omita inteiramente para deixar Skills irrestritas por
  padrão.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Conjunto final explícito de Skills para esse agente. Listas explícitas
  **substituem** padrões herdados; elas não fazem merge. Defina como `[]` para
  não expor Skills para esse agente.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Quando `true`, agentes podem criar propostas pendentes a partir de sinais
  duráveis de conversa após turnos bem-sucedidos. A criação de Skills solicitada
  pelo usuário sempre passa pelo Skill Workshop, independentemente desta configuração.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` exige aprovação do operador antes de aplicar, rejeitar ou colocar em
  quarentena por iniciativa do agente. `auto` permite essas ações sem aprovação.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Permite que a aplicação pelo Skill Workshop escreva por meio de symlinks de
  Skills do workspace cujo destino real já é confiável por
  `skills.load.allowSymlinkTargets`. Mantenha isto desabilitado, a menos que
  aplicações de propostas geradas devam modificar essa raiz compartilhada de
  Skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Máximo de propostas pendentes e em quarentena retidas por workspace.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Tamanho máximo do corpo da proposta em bytes. As descrições de propostas são limitadas rigidamente a
  160 bytes porque aparecem na saída de descoberta e listagem.
</ParamField>

## Raízes de skill com symlink

Por padrão, as raízes de skills de workspace, agent de projeto, diretório extra e
incluídas no pacote são limites de contenção. Uma pasta de skill com symlink em `<workspace>/skills`
que resolve para fora da raiz é ignorada com uma mensagem de log.

Para permitir um layout intencional com symlink, declare o destino confiável:

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

Com esta configuração, `<workspace>/skills/manager -> ~/Projects/manager/skills` é
aceito após a resolução de realpath. `extraDirs` verifica o repositório irmão diretamente;
`allowSymlinkTargets` preserva o caminho com symlink para layouts existentes.

A aplicação do Skill Workshop não grava por esses symlinks por padrão. Para permitir que
a aplicação do Workshop modifique skills em destinos de symlink já confiáveis, habilite isso
separadamente:

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
já aceitam symlinks de diretórios de skill (a contenção de `SKILL.md` por skill ainda
se aplica).

## Skills em sandbox e variáveis de ambiente

<Warning>
  `skills.entries.<skill>.env` e `apiKey` se aplicam somente a execuções no **host**. Dentro
  de uma sandbox, eles não têm efeito — uma skill que depende de `GEMINI_API_KEY` falhará
  com `apiKey not configured`, a menos que a variável seja fornecida à sandbox
  separadamente.
</Warning>

Passe segredos para uma sandbox Docker com:

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
  Usuários com acesso ao daemon do Docker podem inspecionar valores de `sandbox.docker.env`
  por meio dos metadados do Docker. Use um arquivo de segredo montado, uma imagem personalizada ou
  outro caminho de entrega quando essa exposição não for aceitável.
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

Alterações em skills e na configuração entram em vigor na próxima nova sessão quando o
watcher estiver habilitado, ou no próximo turno do agent quando o watcher detectar uma alteração.

## Relacionados

<CardGroup cols={2}>
  <Card title="Referência de Skills" href="/pt-BR/tools/skills" icon="puzzle-piece">
    O que são skills, ordem de carregamento, gating e formato SKILL.md.
  </Card>
  <Card title="Criando skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Criação de skills personalizadas de workspace.
  </Card>
  <Card title="Skill Workshop" href="/pt-BR/tools/skill-workshop" icon="flask">
    Fila de propostas para skills rascunhadas por agents.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo nativo de comandos de barra e diretivas de chat.
  </Card>
</CardGroup>
