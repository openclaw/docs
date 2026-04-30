---
read_when:
    - Configurando SecretRefs para credenciais de provedor e refs de `auth-profiles.json`
    - Operar recarregamento, auditoria, configuração e aplicação de segredos com segurança em produção
    - Entendendo a falha rápida na inicialização, a filtragem de superfícies inativas e o comportamento do último estado válido conhecido
sidebarTitle: Secrets management
summary: 'Gerenciamento de segredos: contrato SecretRef, comportamento do instantâneo em tempo de execução e limpeza unidirecional segura'
title: Gerenciamento de segredos
x-i18n:
    generated_at: "2026-04-30T09:51:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw é compatível com SecretRefs aditivos, para que credenciais compatíveis não precisem ser armazenadas como texto simples na configuração.

<Note>
Texto simples ainda funciona. SecretRefs são opcionais por credencial.
</Note>

## Objetivos e modelo de runtime

Segredos são resolvidos em um snapshot de runtime em memória.

- A resolução é antecipada durante a ativação, não preguiçosa nos caminhos de solicitação.
- A inicialização falha rapidamente quando uma SecretRef efetivamente ativa não pode ser resolvida.
- O recarregamento usa troca atômica: sucesso completo, ou mantém o último snapshot bom conhecido.
- Violações de política de SecretRef (por exemplo, perfis de autenticação em modo OAuth combinados com entrada SecretRef) falham a ativação antes da troca de runtime.
- Solicitações de runtime leem apenas do snapshot ativo em memória.
- Após a primeira ativação/carga de configuração bem-sucedida, os caminhos de código de runtime continuam lendo esse snapshot ativo em memória até que um recarregamento bem-sucedido o substitua.
- Caminhos de entrega de saída também leem desse snapshot ativo (por exemplo, entrega de resposta/thread do Discord e envios de ação do Telegram); eles não resolvem SecretRefs novamente a cada envio.

Isso mantém indisponibilidades do provedor de segredos fora dos caminhos quentes de solicitação.

## Filtragem de superfície ativa

SecretRefs são validadas apenas em superfícies efetivamente ativas.

- Superfícies habilitadas: refs não resolvidas bloqueiam inicialização/recarregamento.
- Superfícies inativas: refs não resolvidas não bloqueiam inicialização/recarregamento.
- Refs inativas emitem diagnósticos não fatais com o código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Examples of inactive surfaces">
    - Entradas de canal/conta desabilitadas.
    - Credenciais de canal de nível superior que nenhuma conta habilitada herda.
    - Superfícies de ferramenta/recurso desabilitadas.
    - Chaves específicas de provedor de pesquisa web que não são selecionadas por `tools.web.search.provider`. No modo automático (provedor não definido), as chaves são consultadas por precedência para detecção automática de provedor até que uma seja resolvida. Após a seleção, chaves de provedores não selecionados são tratadas como inativas até serem selecionadas.
    - Material de autenticação SSH de sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, além de substituições por agente) fica ativo apenas quando o backend de sandbox efetivo é `ssh` para o agente padrão ou um agente habilitado.
    - SecretRefs de `gateway.remote.token` / `gateway.remote.password` ficam ativas se uma destas condições for verdadeira:
      - `gateway.mode=remote`
      - `gateway.remote.url` está configurado
      - `gateway.tailscale.mode` é `serve` ou `funnel`
      - Em modo local sem essas superfícies remotas:
        - `gateway.remote.token` fica ativo quando autenticação por token pode vencer e nenhum token de env/autenticação está configurado.
        - `gateway.remote.password` fica ativo apenas quando autenticação por senha pode vencer e nenhuma senha de env/autenticação está configurada.
    - A SecretRef `gateway.auth.token` fica inativa para resolução de autenticação na inicialização quando `OPENCLAW_GATEWAY_TOKEN` está definido, porque a entrada de token de env vence para esse runtime.

  </Accordion>
</AccordionGroup>

## Diagnósticos da superfície de autenticação do Gateway

Quando uma SecretRef está configurada em `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, a inicialização/recarregamento do Gateway registra explicitamente o estado da superfície:

- `active`: a SecretRef faz parte da superfície de autenticação efetiva e precisa ser resolvida.
- `inactive`: a SecretRef é ignorada para este runtime porque outra superfície de autenticação vence, ou porque a autenticação remota está desabilitada/não ativa.

Essas entradas são registradas com `SECRETS_GATEWAY_AUTH_SURFACE` e incluem o motivo usado pela política de superfície ativa, para que você possa ver por que uma credencial foi tratada como ativa ou inativa.

## Pré-verificação de referência no onboarding

Quando o onboarding é executado em modo interativo e você escolhe armazenamento SecretRef, o OpenClaw executa validação prévia antes de salvar:

- Refs de env: valida o nome da variável de env e confirma que um valor não vazio está visível durante a configuração.
- Refs de provedor (`file` ou `exec`): valida a seleção do provedor, resolve `id` e verifica o tipo do valor resolvido.
- Caminho de reutilização do Quickstart: quando `gateway.auth.token` já é uma SecretRef, o onboarding a resolve antes do bootstrap de probe/dashboard (para refs `env`, `file` e `exec`) usando a mesma barreira de falha rápida.

Se a validação falhar, o onboarding mostra o erro e permite tentar novamente.

## Contrato SecretRef

Use um único formato de objeto em todos os lugares:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Validação:

    - `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corresponder a `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validação:

    - `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve ser um ponteiro JSON absoluto (`/...`)
    - Escape RFC6901 em segmentos: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validação:

    - `provider` deve corresponder a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corresponder a `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` não deve conter `.` ou `..` como segmentos de caminho delimitados por barras (por exemplo, `a/../b` é rejeitado)

  </Tab>
</Tabs>

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
        mode: "json", // or "singleValue"
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

<AccordionGroup>
  <Accordion title="Env provider">
    - Allowlist opcional via `allowlist`.
    - Valores de env ausentes/vazios falham a resolução.

  </Accordion>
  <Accordion title="File provider">
    - Lê arquivo local de `path`.
    - `mode: "json"` espera payload de objeto JSON e resolve `id` como ponteiro.
    - `mode: "singleValue"` espera ref id `"value"` e retorna o conteúdo do arquivo.
    - O caminho deve passar por verificações de propriedade/permissão.
    - Observação de falha fechada no Windows: se a verificação de ACL estiver indisponível para um caminho, a resolução falha. Apenas para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar verificações de segurança de caminho.

  </Accordion>
  <Accordion title="Exec provider">
    - Executa o caminho absoluto do binário configurado, sem shell.
    - Por padrão, `command` deve apontar para um arquivo regular (não um symlink).
    - Defina `allowSymlinkCommand: true` para permitir caminhos de comando symlink (por exemplo, shims do Homebrew). O OpenClaw valida o caminho de destino resolvido.
    - Combine `allowSymlinkCommand` com `trustedDirs` para caminhos de gerenciadores de pacotes (por exemplo, `["/opt/homebrew"]`).
    - Oferece suporte a timeout, timeout sem saída, limites de bytes de saída, allowlist de env e diretórios confiáveis.
    - Observação de falha fechada no Windows: se a verificação de ACL estiver indisponível para o caminho do comando, a resolução falha. Apenas para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar verificações de segurança de caminho.

    Payload da solicitação (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload da resposta (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Erros opcionais por id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Exemplos de integração exec

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  </Accordion>
</AccordionGroup>

## Variáveis de ambiente do servidor MCP

Variáveis de env do servidor MCP configuradas via `plugins.entries.acpx.config.mcpServers` aceitam SecretInput. Isso mantém chaves de API e tokens fora da configuração em texto simples:

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

Valores de string em texto simples ainda funcionam. Refs de template de env como `${MCP_SERVER_API_KEY}` e objetos SecretRef são resolvidos durante a ativação do Gateway antes que o processo do servidor MCP seja iniciado. Como em outras superfícies SecretRef, refs não resolvidas só bloqueiam a ativação quando o Plugin `acpx` está efetivamente ativo.

## Material de autenticação SSH de sandbox

O backend de sandbox `ssh` do core também oferece suporte a SecretRefs para material de autenticação SSH:

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

Comportamento de runtime:

- O OpenClaw resolve essas refs durante a ativação do sandbox, não de forma preguiçosa durante cada chamada SSH.
- Os valores resolvidos são gravados em arquivos temporários com permissões restritivas e usados na configuração SSH gerada.
- Se o backend de sandbox efetivo não for `ssh`, essas refs permanecem inativas e não bloqueiam a inicialização.

## Superfície de credenciais compatível

As credenciais canônicas compatíveis e incompatíveis estão listadas em:

- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)

<Note>
Credenciais emitidas em tempo de execução ou rotativas e material de atualização OAuth são excluídos intencionalmente da resolução SecretRef somente leitura.
</Note>

## Comportamento obrigatório e precedência

- Campo sem uma ref: inalterado.
- Campo com uma ref: obrigatório em superfícies ativas durante a ativação.
- Se texto simples e ref estiverem presentes, a ref terá precedência nos caminhos de precedência compatíveis.
- O sentinela de redação `__OPENCLAW_REDACTED__` é reservado para redação/restauração interna de configuração e é rejeitado como dados literais de configuração enviados.

Sinais de aviso e auditoria:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (aviso de tempo de execução)
- `REF_SHADOWED` (achado de auditoria quando as credenciais de `auth-profiles.json` têm precedência sobre refs de `openclaw.json`)

Comportamento de compatibilidade do Google Chat:

- `serviceAccountRef` tem precedência sobre `serviceAccount` em texto simples.
- O valor em texto simples é ignorado quando a ref irmã está definida.

## Acionadores de ativação

A ativação de segredos é executada em:

- Inicialização (pré-verificação mais ativação final)
- Caminho de aplicação a quente do recarregamento de configuração
- Caminho de verificação de reinício do recarregamento de configuração
- Recarregamento manual via `secrets.reload`
- Pré-verificação RPC de gravação de configuração do Gateway (`config.set` / `config.apply` / `config.patch`) para resolubilidade de SecretRef em superfícies ativas dentro da carga de configuração enviada antes de persistir edições

Contrato de ativação:

- O sucesso troca o snapshot atomicamente.
- Falha na inicialização aborta a inicialização do gateway.
- Falha no recarregamento em tempo de execução mantém o último snapshot válido conhecido.
- Falha na pré-verificação de RPC de gravação rejeita a configuração enviada e mantém inalterados tanto a configuração em disco quanto o snapshot ativo em tempo de execução.
- Fornecer um token de canal explícito por chamada a uma chamada de helper/ferramenta de saída não aciona a ativação de SecretRef; os pontos de ativação continuam sendo inicialização, recarregamento e `secrets.reload` explícito.

## Sinais de degradação e recuperação

Quando a ativação no momento do recarregamento falha após um estado saudável, o OpenClaw entra em estado de segredos degradado.

Códigos de evento de sistema de disparo único e de log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradado: o tempo de execução mantém o último snapshot válido conhecido.
- Recuperado: emitido uma vez após a próxima ativação bem-sucedida.
- Falhas repetidas enquanto já está degradado registram avisos, mas não disparam eventos em excesso.
- Falha rápida na inicialização não emite eventos degradados porque o tempo de execução nunca ficou ativo.

## Resolução de caminhos de comando

Caminhos de comando podem optar pela resolução SecretRef compatível via RPC de snapshot do Gateway.

Há dois comportamentos amplos:

<Tabs>
  <Tab title="Caminhos de comando estritos">
    Por exemplo, caminhos de memória remota de `openclaw memory` e `openclaw qr --remote` quando precisa de refs de segredo compartilhado remoto. Eles leem do snapshot ativo e falham rapidamente quando uma SecretRef obrigatória está indisponível.
  </Tab>
  <Tab title="Caminhos de comando somente leitura">
    Por exemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e fluxos somente leitura de doctor/reparo de configuração. Eles também preferem o snapshot ativo, mas degradam em vez de abortar quando uma SecretRef direcionada está indisponível nesse caminho de comando.

    Comportamento somente leitura:

    - Quando o Gateway está em execução, esses comandos leem primeiro do snapshot ativo.
    - Se a resolução do Gateway estiver incompleta ou o Gateway estiver indisponível, eles tentam fallback local direcionado para a superfície específica do comando.
    - Se uma SecretRef direcionada ainda estiver indisponível, o comando continua com saída somente leitura degradada e diagnósticos explícitos, como "configurado, mas indisponível neste caminho de comando".
    - Esse comportamento degradado é apenas local ao comando. Ele não enfraquece os caminhos de inicialização, recarregamento ou envio/autenticação em tempo de execução.

  </Tab>
</Tabs>

Outras observações:

- A atualização do snapshot após rotação de segredo no backend é tratada por `openclaw secrets reload`.
- Método RPC do Gateway usado por esses caminhos de comando: `secrets.resolve`.

## Fluxo de auditoria e configuração

Fluxo padrão do operador:

<Steps>
  <Step title="Auditar estado atual">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configurar SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Auditar novamente">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Achados incluem:

    - valores em texto simples em repouso (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` gerados)
    - resíduos de cabeçalhos sensíveis de provedores em texto simples em entradas `models.json` geradas
    - refs não resolvidas
    - sombreamento por precedência (`auth-profiles.json` tendo prioridade sobre refs de `openclaw.json`)
    - resíduos legados (`auth.json`, lembretes OAuth)

    Observação sobre exec:

    - Por padrão, a auditoria ignora verificações de resolubilidade de SecretRef exec para evitar efeitos colaterais de comandos.
    - Use `openclaw secrets audit --allow-exec` para executar provedores exec durante a auditoria.

    Observação sobre resíduos de cabeçalho:

    - A detecção de cabeçalhos sensíveis de provedores é baseada em heurística de nome (nomes comuns de cabeçalhos de autenticação/credenciais e fragmentos como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interativo que:

    - configura `secrets.providers` primeiro (`env`/`file`/`exec`, adicionar/editar/remover)
    - permite selecionar campos compatíveis que contêm segredos em `openclaw.json` mais `auth-profiles.json` para um escopo de agente
    - pode criar um novo mapeamento `auth-profiles.json` diretamente no seletor de destino
    - captura detalhes da SecretRef (`source`, `provider`, `id`)
    - executa resolução de pré-verificação
    - pode aplicar imediatamente

    Observação sobre exec:

    - A pré-verificação ignora verificações de SecretRef exec, a menos que `--allow-exec` esteja definido.
    - Se você aplicar diretamente de `configure --apply` e o plano incluir refs/provedores exec, mantenha `--allow-exec` definido também para a etapa de aplicação.

    Modos úteis:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Padrões de aplicação de `configure`:

    - limpar credenciais estáticas correspondentes de `auth-profiles.json` para provedores direcionados
    - limpar entradas `api_key` estáticas legadas de `auth.json`
    - limpar linhas de segredo conhecidas correspondentes de `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Aplicar um plano salvo:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Observação sobre exec:

    - dry-run ignora verificações exec, a menos que `--allow-exec` esteja definido.
    - o modo de gravação rejeita planos contendo SecretRefs/provedores exec, a menos que `--allow-exec` esteja definido.

    Para detalhes do contrato estrito de destino/caminho e regras exatas de rejeição, consulte [Contrato de plano de aplicação de segredos](/pt-BR/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de segurança unidirecional

<Warning>
O OpenClaw intencionalmente não grava backups de reversão contendo valores históricos de segredos em texto simples.
</Warning>

Modelo de segurança:

- a pré-verificação deve ser bem-sucedida antes do modo de gravação
- a ativação em tempo de execução é validada antes do commit
- a aplicação atualiza arquivos usando substituição atômica de arquivo e restauração de melhor esforço em caso de falha

## Observações de compatibilidade de autenticação legada

Para credenciais estáticas, o tempo de execução não depende mais do armazenamento legado de autenticação em texto simples.

- A fonte de credenciais em tempo de execução é o snapshot resolvido em memória.
- Entradas `api_key` estáticas legadas são limpas quando descobertas.
- O comportamento de compatibilidade relacionado ao OAuth permanece separado.

## Observação sobre Web UI

Algumas uniões SecretInput são mais fáceis de configurar no modo editor bruto do que no modo formulário.

## Relacionado

- [Autenticação](/pt-BR/gateway/authentication) — configuração de autenticação
- [CLI: secrets](/pt-BR/cli/secrets) — comandos da CLI
- [Variáveis de ambiente](/pt-BR/help/environment) — precedência de ambiente
- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) — superfície de credenciais
- [Contrato de plano de aplicação de segredos](/pt-BR/gateway/secrets-plan-contract) — detalhes do contrato do plano
- [Segurança](/pt-BR/gateway/security) — postura de segurança
