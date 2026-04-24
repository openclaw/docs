---
read_when:
    - Configurando SecretRefs para credenciais de provedores e refs de `auth-profiles.json`
    - Operando recarga, auditoria, configuração e aplicação de segredos com segurança em produção
    - Entendendo fail-fast na inicialização, filtragem de superfície inativa e comportamento do último estado válido conhecido
summary: 'Gerenciamento de segredos: contrato SecretRef, comportamento de snapshot em runtime e limpeza segura unidirecional'
title: Gerenciamento de segredos
x-i18n:
    generated_at: "2026-04-24T05:53:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

O OpenClaw oferece suporte a SecretRefs aditivos para que credenciais compatíveis não precisem ser armazenadas em texto simples na configuração.

Texto simples continua funcionando. SecretRefs são opt-in por credencial.

## Objetivos e modelo de runtime

Os segredos são resolvidos em um snapshot de runtime na memória.

- A resolução é antecipada durante a ativação, não preguiçosa nos caminhos de solicitação.
- A inicialização falha rapidamente quando um SecretRef efetivamente ativo não pode ser resolvido.
- A recarga usa troca atômica: sucesso completo ou manutenção do último snapshot válido conhecido.
- Violações de política de SecretRef (por exemplo, perfis de autenticação em modo OAuth combinados com entrada SecretRef) fazem a ativação falhar antes da troca de runtime.
- Solicitações de runtime leem apenas do snapshot ativo na memória.
- Após a primeira ativação/carga bem-sucedida da configuração, os caminhos de código em runtime continuam lendo esse snapshot ativo na memória até que uma recarga bem-sucedida faça a troca.
- Caminhos de entrega de saída também leem desse snapshot ativo (por exemplo, entrega de resposta/thread no Discord e envios de ação no Telegram); eles não resolvem SecretRefs novamente a cada envio.

Isso mantém falhas de provedores de segredos fora dos caminhos quentes de solicitação.

## Filtragem de superfície ativa

SecretRefs são validados apenas em superfícies efetivamente ativas.

- Superfícies ativadas: refs não resolvidas bloqueiam inicialização/recarga.
- Superfícies inativas: refs não resolvidas não bloqueiam inicialização/recarga.
- Refs inativas emitem diagnósticos não fatais com código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Exemplos de superfícies inativas:

- Entradas de canal/conta desativadas.
- Credenciais de canal de nível superior que nenhuma conta ativada herda.
- Superfícies de ferramenta/recurso desativadas.
- Chaves específicas de provedor de pesquisa na web que não são selecionadas por `tools.web.search.provider`.
  No modo automático (provedor não definido), as chaves são consultadas por precedência para autodetecção de provedor até que uma seja resolvida.
  Após a seleção, chaves de provedores não selecionados são tratadas como inativas até serem selecionadas.
- Material de autenticação SSH do sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, mais substituições por agente) fica ativo somente
  quando o backend efetivo do sandbox é `ssh` para o agente padrão ou um agente ativado.
- SecretRefs de `gateway.remote.token` / `gateway.remote.password` ficam ativas se uma destas condições for verdadeira:
  - `gateway.mode=remote`
  - `gateway.remote.url` está configurado
  - `gateway.tailscale.mode` é `serve` ou `funnel`
  - No modo local sem essas superfícies remotas:
    - `gateway.remote.token` está ativo quando a autenticação por token pode prevalecer e nenhum token de env/auth está configurado.
    - `gateway.remote.password` está ativo apenas quando a autenticação por senha pode prevalecer e nenhuma senha de env/auth está configurada.
- O SecretRef de `gateway.auth.token` fica inativo para resolução de autenticação na inicialização quando `OPENCLAW_GATEWAY_TOKEN` está definido, porque a entrada de token do env prevalece para esse runtime.

## Diagnósticos de superfície de autenticação do Gateway

Quando um SecretRef está configurado em `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` ou `gateway.remote.password`, a inicialização/recarga do gateway registra explicitamente o
estado da superfície:

- `active`: o SecretRef faz parte da superfície efetiva de autenticação e precisa ser resolvido.
- `inactive`: o SecretRef é ignorado para este runtime porque outra superfície de autenticação prevalece, ou
  porque a autenticação remota está desativada/inativa.

Essas entradas são registradas com `SECRETS_GATEWAY_AUTH_SURFACE` e incluem o motivo usado pela
política de superfície ativa, para que você possa ver por que uma credencial foi tratada como ativa ou inativa.

## Verificação preliminar de referência no onboarding

Quando o onboarding é executado em modo interativo e você escolhe armazenamento por SecretRef, o OpenClaw executa validação preliminar antes de salvar:

- Refs de env: valida o nome da variável de ambiente e confirma que um valor não vazio está visível durante a configuração.
- Refs de provedor (`file` ou `exec`): valida a seleção do provedor, resolve `id` e verifica o tipo do valor resolvido.
- Caminho de reutilização do quickstart: quando `gateway.auth.token` já é um SecretRef, o onboarding o resolve antes do bootstrap de probe/dashboard (para refs `env`, `file` e `exec`) usando o mesmo bloqueio fail-fast.

Se a validação falhar, o onboarding mostra o erro e permite que você tente novamente.

## Contrato SecretRef

Use um formato de objeto em todos os lugares:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Validação:

- `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
- `id` deve corresponder a `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Validação:

- `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
- `id` deve ser um ponteiro JSON absoluto (`/...`)
- Escapamento RFC6901 em segmentos: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Validação:

- `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
- `id` deve corresponder a `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` não deve conter `.` ou `..` como segmentos de caminho delimitados por barra (por exemplo `a/../b` é rejeitado)

## Configuração do provedor

Defina provedores em `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // ou "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Provedor env

- Allowlist opcional via `allowlist`.
- Valores de env ausentes/vazios fazem a resolução falhar.

### Provedor file

- Lê arquivo local de `path`.
- `mode: "json"` espera payload de objeto JSON e resolve `id` como ponteiro.
- `mode: "singleValue"` espera ID de ref `"value"` e retorna o conteúdo do arquivo.
- O caminho deve passar nas verificações de propriedade/permissão.
- Observação fail-closed no Windows: se a verificação de ACL não estiver disponível para um caminho, a resolução falha. Apenas para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar verificações de segurança do caminho.

### Provedor exec

- Executa o caminho absoluto configurado do binário, sem shell.
- Por padrão, `command` deve apontar para um arquivo regular (não um symlink).
- Defina `allowSymlinkCommand: true` para permitir caminhos de comando por symlink (por exemplo, shims do Homebrew). O OpenClaw valida o caminho resolvido do destino.
- Combine `allowSymlinkCommand` com `trustedDirs` para caminhos de gerenciador de pacotes (por exemplo `["/opt/homebrew"]`).
- Oferece suporte a timeout, timeout sem saída, limites de bytes de saída, allowlist de env e diretórios confiáveis.
- Observação fail-closed no Windows: se a verificação de ACL não estiver disponível para o caminho do comando, a resolução falha. Apenas para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar verificações de segurança do caminho.

Payload da solicitação (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload da resposta (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Erros opcionais por ID:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exemplos de integração exec

### CLI do 1Password

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // necessário para binários com symlink do Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### CLI do HashiCorp Vault

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // necessário para binários com symlink do Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // necessário para binários com symlink do Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## Variáveis de ambiente de servidor MCP

Variáveis de ambiente de servidor MCP configuradas via `plugins.entries.acpx.config.mcpServers` oferecem suporte a SecretInput. Isso mantém chaves de API e tokens fora da configuração em texto simples:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Valores de string em texto simples continuam funcionando. Refs de modelo de env como `${MCP_SERVER_API_KEY}` e objetos SecretRef são resolvidos durante a ativação do gateway antes que o processo do servidor MCP seja iniciado. Assim como em outras superfícies de SecretRef, refs não resolvidas só bloqueiam a ativação quando o Plugin `acpx` está efetivamente ativo.

## Material de autenticação SSH do sandbox

O backend central `ssh` do sandbox também oferece suporte a SecretRefs para material de autenticação SSH:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Comportamento em runtime:

- O OpenClaw resolve essas refs durante a ativação do sandbox, não de forma preguiçosa durante cada chamada SSH.
- Valores resolvidos são gravados em arquivos temporários com permissões restritivas e usados na configuração SSH gerada.
- Se o backend efetivo do sandbox não for `ssh`, essas refs permanecem inativas e não bloqueiam a inicialização.

## Superfície de credencial compatível

Credenciais canônicas compatíveis e não compatíveis estão listadas em:

- [Superfície de credencial SecretRef](/pt-BR/reference/secretref-credential-surface)

Credenciais geradas em runtime, rotativas e material de refresh de OAuth são intencionalmente excluídos da resolução SecretRef somente leitura.

## Comportamento obrigatório e precedência

- Campo sem ref: inalterado.
- Campo com ref: obrigatório em superfícies ativas durante a ativação.
- Se texto simples e ref estiverem presentes, a ref tem precedência nos caminhos compatíveis de precedência.
- O sentinel de redação `__OPENCLAW_REDACTED__` é reservado para redação/restauração interna de configuração e é rejeitado como dado literal enviado na configuração.

Sinais de aviso e auditoria:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (aviso de runtime)
- `REF_SHADOWED` (achado de auditoria quando credenciais de `auth-profiles.json` têm precedência sobre refs de `openclaw.json`)

Comportamento de compatibilidade do Google Chat:

- `serviceAccountRef` tem precedência sobre `serviceAccount` em texto simples.
- O valor em texto simples é ignorado quando a ref irmã está definida.

## Gatilhos de ativação

A ativação de segredos é executada em:

- Inicialização (verificação preliminar mais ativação final)
- Caminho de hot-apply de recarga de configuração
- Caminho de verificação de reinício da recarga de configuração
- Recarga manual via `secrets.reload`
- Verificação preliminar via RPC de gravação de configuração do Gateway (`config.set` / `config.apply` / `config.patch`) para resolubilidade de SecretRef de superfície ativa dentro do payload de configuração enviado antes de persistir as edições

Contrato de ativação:

- Sucesso troca o snapshot de forma atômica.
- Falha na inicialização aborta a inicialização do gateway.
- Falha de recarga em runtime mantém o último snapshot válido conhecido.
- Falha na verificação preliminar de RPC de gravação rejeita a configuração enviada e mantém inalterados tanto a configuração em disco quanto o snapshot ativo de runtime.
- Fornecer um token explícito por chamada de canal para uma chamada de helper/ferramenta de saída não dispara ativação de SecretRef; os pontos de ativação continuam sendo inicialização, recarga e `secrets.reload` explícito.

## Sinais de degradação e recuperação

Quando a ativação em tempo de recarga falha após um estado íntegro, o OpenClaw entra em estado degradado de segredos.

Evento de sistema único e códigos de log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradado: o runtime mantém o último snapshot válido conhecido.
- Recuperado: emitido uma vez após a próxima ativação bem-sucedida.
- Falhas repetidas quando já está degradado registram avisos, mas não inundam com eventos.
- O fail-fast da inicialização não emite eventos degradados porque o runtime nunca chegou a ficar ativo.

## Resolução no caminho de comando

Caminhos de comando podem optar por resolução compatível de SecretRef via RPC de snapshot do gateway.

Há dois comportamentos gerais:

- Caminhos de comando estritos (por exemplo, caminhos de memória remota de `openclaw memory` e `openclaw qr --remote` quando precisam de refs remotas de segredo compartilhado) leem do snapshot ativo e falham rapidamente quando um SecretRef obrigatório não está disponível.
- Caminhos de comando somente leitura (por exemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e fluxos somente leitura de reparo do doctor/configuração) também preferem o snapshot ativo, mas degradam em vez de abortar quando um SecretRef direcionado não está disponível nesse caminho de comando.

Comportamento somente leitura:

- Quando o gateway está em execução, esses comandos leem primeiro do snapshot ativo.
- Se a resolução do gateway estiver incompleta ou o gateway não estiver disponível, eles tentam um fallback local direcionado para a superfície específica do comando.
- Se um SecretRef direcionado ainda estiver indisponível, o comando continua com saída degradada somente leitura e diagnósticos explícitos como “configurado, mas indisponível neste caminho de comando”.
- Esse comportamento degradado é apenas local ao comando. Ele não enfraquece inicialização, recarga ou caminhos de envio/autenticação em runtime.

Outras observações:

- A atualização do snapshot após rotação de segredo no backend é tratada por `openclaw secrets reload`.
- Método RPC do Gateway usado por esses caminhos de comando: `secrets.resolve`.

## Fluxo de trabalho de auditoria e configuração

Fluxo padrão do operador:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Os achados incluem:

- valores em texto simples em repouso (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` gerado)
- resíduos de cabeçalhos sensíveis de provedores em texto simples em entradas geradas de `models.json`
- refs não resolvidas
- shadowing por precedência (`auth-profiles.json` tendo prioridade sobre refs de `openclaw.json`)
- resíduos legados (`auth.json`, lembretes de OAuth)

Observação sobre exec:

- Por padrão, a auditoria ignora verificações de resolubilidade de SecretRef exec para evitar efeitos colaterais do comando.
- Use `openclaw secrets audit --allow-exec` para executar provedores exec durante a auditoria.

Observação sobre resíduos de cabeçalho:

- A detecção de cabeçalhos sensíveis de provedores é baseada em heurística de nomes (nomes comuns de cabeçalhos de autenticação/credenciais e fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

### `secrets configure`

Auxiliar interativo que:

- configura primeiro `secrets.providers` (`env`/`file`/`exec`, adicionar/editar/remover)
- permite selecionar campos compatíveis que carregam segredos em `openclaw.json` mais `auth-profiles.json` para um escopo de agente
- pode criar um novo mapeamento `auth-profiles.json` diretamente no seletor de destino
- captura detalhes de SecretRef (`source`, `provider`, `id`)
- executa resolução preliminar
- pode aplicar imediatamente

Observação sobre exec:

- A verificação preliminar ignora checagens de SecretRef exec a menos que `--allow-exec` esteja definido.
- Se você aplicar diretamente de `configure --apply` e o plano incluir refs/provedores exec, mantenha `--allow-exec` definido também para a etapa de aplicação.

Modos úteis:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Padrões de aplicação de `configure`:

- limpa credenciais estáticas correspondentes de `auth-profiles.json` para provedores direcionados
- limpa entradas estáticas legadas `api_key` de `auth.json`
- limpa linhas correspondentes de segredo conhecido de `<config-dir>/.env`

### `secrets apply`

Aplica um plano salvo:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Observação sobre exec:

- `dry-run` ignora verificações exec a menos que `--allow-exec` esteja definido.
- O modo de gravação rejeita planos que contenham SecretRefs/provedores exec a menos que `--allow-exec` esteja definido.

Para detalhes estritos do contrato de destino/caminho e regras exatas de rejeição, consulte:

- [Contrato do plano Secrets Apply](/pt-BR/gateway/secrets-plan-contract)

## Política de segurança unidirecional

O OpenClaw intencionalmente não grava backups de reversão contendo valores históricos de segredos em texto simples.

Modelo de segurança:

- a verificação preliminar deve ser bem-sucedida antes do modo de gravação
- a ativação em runtime é validada antes do commit
- a aplicação atualiza arquivos usando substituição atômica de arquivo e restauração de melhor esforço em caso de falha

## Observações sobre compatibilidade de autenticação legada

Para credenciais estáticas, o runtime não depende mais do armazenamento legado de autenticação em texto simples.

- A fonte de credenciais em runtime é o snapshot resolvido na memória.
- Entradas estáticas legadas `api_key` são limpas quando descobertas.
- O comportamento de compatibilidade relacionado a OAuth permanece separado.

## Observação sobre a UI web

Algumas uniões de SecretInput são mais fáceis de configurar no modo editor bruto do que no modo formulário.

## Documentos relacionados

- Comandos CLI: [secrets](/pt-BR/cli/secrets)
- Detalhes do contrato do plano: [Contrato do plano Secrets Apply](/pt-BR/gateway/secrets-plan-contract)
- Superfície de credenciais: [Superfície de credencial SecretRef](/pt-BR/reference/secretref-credential-surface)
- Configuração de autenticação: [Autenticação](/pt-BR/gateway/authentication)
- Postura de segurança: [Segurança](/pt-BR/gateway/security)
- Precedência de ambiente: [Variáveis de ambiente](/pt-BR/help/environment)
