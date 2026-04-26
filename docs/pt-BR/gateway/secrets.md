---
read_when:
    - Configurando SecretRefs para credenciais de provedor e refs do `auth-profiles.json`
    - Operando reload, auditoria, configuração e aplicação de segredos com segurança em produção
    - Entendendo fail-fast no startup, filtragem de superfície inativa e comportamento de último estado válido conhecido
sidebarTitle: Secrets management
summary: 'Gerenciamento de segredos: contrato SecretRef, comportamento de snapshot em runtime e limpeza unidirecional segura'
title: Gerenciamento de segredos
x-i18n:
    generated_at: "2026-04-26T11:30:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

O OpenClaw oferece suporte a SecretRefs aditivos para que credenciais compatíveis não precisem ser armazenadas como texto simples na configuração.

<Note>
Texto simples ainda funciona. SecretRefs são opt-in por credencial.
</Note>

## Objetivos e modelo de runtime

Segredos são resolvidos em um snapshot de runtime em memória.

- A resolução é eager durante a ativação, não lazy em caminhos de requisição.
- O startup falha rapidamente quando um SecretRef efetivamente ativo não pode ser resolvido.
- O reload usa troca atômica: sucesso completo, ou manutenção do último snapshot válido conhecido.
- Violações de política de SecretRef (por exemplo, perfis de auth em modo OAuth combinados com entrada SecretRef) falham na ativação antes da troca de runtime.
- Requisições de runtime leem apenas do snapshot ativo em memória.
- Após o primeiro carregamento/ativação de configuração bem-sucedido, os caminhos de código de runtime continuam lendo esse snapshot ativo em memória até que um reload bem-sucedido o substitua.
- Caminhos de entrega de saída também leem desse snapshot ativo (por exemplo, entrega de resposta/thread do Discord e envios de ações do Telegram); eles não resolvem novamente SecretRefs a cada envio.

Isso mantém indisponibilidades do provedor de segredos fora dos caminhos de requisição quentes.

## Filtragem de superfície ativa

SecretRefs são validados apenas em superfícies efetivamente ativas.

- Superfícies ativadas: refs não resolvidas bloqueiam startup/reload.
- Superfícies inativas: refs não resolvidas não bloqueiam startup/reload.
- Refs inativas emitem diagnósticos não fatais com o código `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Exemplos de superfícies inativas">
    - Entradas de canal/conta desativadas.
    - Credenciais de canal de nível superior que nenhuma conta ativada herda.
    - Superfícies de ferramenta/recurso desativadas.
    - Chaves específicas de provedor para pesquisa web que não estão selecionadas por `tools.web.search.provider`. No modo automático (provedor não definido), as chaves são consultadas por precedência para detecção automática de provedor até que uma seja resolvida. Após a seleção, chaves de provedores não selecionados são tratadas como inativas até serem selecionadas.
    - Material de auth SSH do sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, além de substituições por agente) fica ativo apenas quando o backend efetivo do sandbox é `ssh` para o agente padrão ou um agente ativado.
    - SecretRefs de `gateway.remote.token` / `gateway.remote.password` ficam ativas se uma destas condições for verdadeira:
      - `gateway.mode=remote`
      - `gateway.remote.url` está configurado
      - `gateway.tailscale.mode` é `serve` ou `funnel`
      - No modo local sem essas superfícies remotas:
        - `gateway.remote.token` fica ativo quando a auth por token pode prevalecer e nenhum token de env/auth está configurado.
        - `gateway.remote.password` fica ativo apenas quando a auth por senha pode prevalecer e nenhuma senha de env/auth está configurada.
    - O SecretRef de `gateway.auth.token` fica inativo para resolução de auth no startup quando `OPENCLAW_GATEWAY_TOKEN` está definido, porque a entrada de token de env prevalece para esse runtime.
  </Accordion>
</AccordionGroup>

## Diagnósticos de superfície de auth do Gateway

Quando um SecretRef é configurado em `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, o startup/reload do Gateway registra explicitamente o estado da superfície:

- `active`: o SecretRef faz parte da superfície de auth efetiva e deve ser resolvido.
- `inactive`: o SecretRef é ignorado neste runtime porque outra superfície de auth prevalece, ou porque a auth remota está desativada/inativa.

Essas entradas são registradas com `SECRETS_GATEWAY_AUTH_SURFACE` e incluem o motivo usado pela política de superfície ativa, para que você possa ver por que uma credencial foi tratada como ativa ou inativa.

## Preflight de referência no onboarding

Quando o onboarding é executado em modo interativo e você escolhe armazenamento por SecretRef, o OpenClaw executa validação de preflight antes de salvar:

- Refs de env: valida o nome da variável de ambiente e confirma que um valor não vazio está visível durante a configuração.
- Refs de provedor (`file` ou `exec`): valida a seleção do provedor, resolve `id` e verifica o tipo do valor resolvido.
- Caminho de reutilização do quickstart: quando `gateway.auth.token` já é um SecretRef, o onboarding o resolve antes do bootstrap de probe/dashboard (para refs `env`, `file` e `exec`) usando o mesmo gate de fail-fast.

Se a validação falhar, o onboarding mostrará o erro e permitirá nova tentativa.

## Contrato SecretRef

Use um formato de objeto em todos os lugares:

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
    - `id` não deve conter `.` nem `..` como segmentos de caminho delimitados por barra (por exemplo, `a/../b` é rejeitado)

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

<AccordionGroup>
  <Accordion title="Provedor de env">
    - Lista de permissões opcional via `allowlist`.
    - Valores de env ausentes/vazios falham na resolução.
  </Accordion>
  <Accordion title="Provedor de file">
    - Lê arquivo local de `path`.
    - `mode: "json"` espera payload de objeto JSON e resolve `id` como ponteiro.
    - `mode: "singleValue"` espera o id de ref `"value"` e retorna o conteúdo do arquivo.
    - O caminho deve passar por verificações de propriedade/permissão.
    - Observação fail-closed no Windows: se a verificação de ACL estiver indisponível para um caminho, a resolução falha. Apenas para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar verificações de segurança do caminho.
  </Accordion>
  <Accordion title="Provedor de exec">
    - Executa o caminho absoluto do binário configurado, sem shell.
    - Por padrão, `command` deve apontar para um arquivo regular (não um symlink).
    - Defina `allowSymlinkCommand: true` para permitir caminhos de comando em symlink (por exemplo, shims do Homebrew). O OpenClaw valida o caminho do alvo resolvido.
    - Combine `allowSymlinkCommand` com `trustedDirs` para caminhos de gerenciadores de pacote (por exemplo `["/opt/homebrew"]`).
    - Oferece suporte a timeout, timeout sem saída, limites de bytes de saída, lista de permissões de env e diretórios confiáveis.
    - Observação fail-closed no Windows: se a verificação de ACL estiver indisponível para o caminho do comando, a resolução falha. Apenas para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar verificações de segurança do caminho.

    Payload da requisição (stdin):

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

## Exemplos de integração com exec

<AccordionGroup>
  <Accordion title="CLI do 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // obrigatório para binários em symlink do Homebrew
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
  <Accordion title="CLI do HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // obrigatório para binários em symlink do Homebrew
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
            allowSymlinkCommand: true, // obrigatório para binários em symlink do Homebrew
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

Variáveis de ambiente do servidor MCP configuradas via `plugins.entries.acpx.config.mcpServers` oferecem suporte a SecretInput. Isso mantém chaves de API e tokens fora da configuração em texto simples:

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

Valores em string de texto simples continuam funcionando. Refs de template de env como `${MCP_SERVER_API_KEY}` e objetos SecretRef são resolvidos durante a ativação do Gateway antes de o processo do servidor MCP ser iniciado. Como em outras superfícies de SecretRef, refs não resolvidas só bloqueiam a ativação quando o Plugin `acpx` está efetivamente ativo.

## Material de auth SSH do sandbox

O backend `ssh` de sandbox do core também oferece suporte a SecretRefs para material de auth SSH:

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

- O OpenClaw resolve essas refs durante a ativação do sandbox, não de forma lazy a cada chamada SSH.
- Valores resolvidos são gravados em arquivos temporários com permissões restritivas e usados na configuração SSH gerada.
- Se o backend efetivo do sandbox não for `ssh`, essas refs permanecem inativas e não bloqueiam o startup.

## Superfície de credenciais compatível

As credenciais canônicas compatíveis e incompatíveis estão listadas em:

- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)

<Note>
Credenciais geradas em runtime ou rotativas e material de refresh OAuth são intencionalmente excluídos da resolução SecretRef somente leitura.
</Note>

## Comportamento obrigatório e precedência

- Campo sem uma ref: inalterado.
- Campo com uma ref: obrigatório em superfícies ativas durante a ativação.
- Se texto simples e ref estiverem presentes, a ref tem precedência em caminhos de precedência compatíveis.
- O sentinel de redação `__OPENCLAW_REDACTED__` é reservado para redação/restauração interna de configuração e é rejeitado como dado literal enviado na configuração.

Sinais de aviso e auditoria:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (aviso de runtime)
- `REF_SHADOWED` (achado de auditoria quando credenciais de `auth-profiles.json` têm precedência sobre refs de `openclaw.json`)

Comportamento de compatibilidade do Google Chat:

- `serviceAccountRef` tem precedência sobre `serviceAccount` em texto simples.
- O valor em texto simples é ignorado quando a ref irmã está definida.

## Gatilhos de ativação

A ativação de segredos é executada em:

- Startup (preflight mais ativação final)
- Caminho hot-apply de reload de configuração
- Caminho de verificação de restart de reload de configuração
- Reload manual via `secrets.reload`
- Preflight de RPC de gravação de configuração do Gateway (`config.set` / `config.apply` / `config.patch`) para resolubilidade de SecretRef em superfície ativa dentro do payload de configuração enviado antes de persistir as edições

Contrato de ativação:

- Sucesso troca o snapshot atomicamente.
- Falha no startup aborta o startup do Gateway.
- Falha no reload em runtime mantém o último snapshot válido conhecido.
- Falha no preflight de write-RPC rejeita a configuração enviada e mantém inalterados tanto a configuração em disco quanto o snapshot ativo de runtime.
- Fornecer um token explícito por chamada de canal a uma chamada de helper/ferramenta de saída não dispara ativação de SecretRef; os pontos de ativação continuam sendo startup, reload e `secrets.reload` explícito.

## Sinais de degradado e recuperado

Quando a ativação no reload falha após um estado saudável, o OpenClaw entra em estado de segredos degradado.

Evento único do sistema e códigos de log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradado: o runtime mantém o último snapshot válido conhecido.
- Recuperado: emitido uma vez após a próxima ativação bem-sucedida.
- Falhas repetidas enquanto já está degradado registram avisos, mas não geram spam de eventos.
- O fail-fast no startup não emite eventos de degradado porque o runtime nunca ficou ativo.

## Resolução em caminhos de comando

Caminhos de comando podem fazer opt-in para resolução SecretRef compatível via RPC de snapshot do Gateway.

Há dois comportamentos amplos:

<Tabs>
  <Tab title="Caminhos de comando estritos">
    Por exemplo, caminhos de memória remota de `openclaw memory` e `openclaw qr --remote` quando precisam de refs remotas de segredo compartilhado. Eles leem do snapshot ativo e falham rapidamente quando um SecretRef obrigatório está indisponível.
  </Tab>
  <Tab title="Caminhos de comando somente leitura">
    Por exemplo, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e fluxos somente leitura de Doctor/reparo de configuração. Eles também preferem o snapshot ativo, mas degradam em vez de abortar quando um SecretRef alvo está indisponível nesse caminho de comando.

    Comportamento somente leitura:

    - Quando o Gateway está em execução, esses comandos leem primeiro do snapshot ativo.
    - Se a resolução do Gateway estiver incompleta ou o Gateway estiver indisponível, eles tentam um fallback local direcionado para a superfície específica do comando.
    - Se um SecretRef alvo ainda estiver indisponível, o comando continua com saída degradada somente leitura e diagnósticos explícitos como "configurado, mas indisponível neste caminho de comando".
    - Esse comportamento degradado é apenas local ao comando. Ele não enfraquece os caminhos de startup, reload ou envio/auth do runtime.

  </Tab>
</Tabs>

Outras observações:

- A atualização do snapshot após rotação de segredo no backend é tratada por `openclaw secrets reload`.
- Método de RPC do Gateway usado por esses caminhos de comando: `secrets.resolve`.

## Fluxo de auditoria e configuração

Fluxo padrão do operador:

<Steps>
  <Step title="Auditar o estado atual">
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
    Os achados incluem:

    - valores em texto simples em repouso (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` gerados)
    - resíduos de cabeçalhos sensíveis de provedores em texto simples em entradas geradas de `models.json`
    - refs não resolvidas
    - sombreamento por precedência (`auth-profiles.json` tendo prioridade sobre refs de `openclaw.json`)
    - resíduos legados (`auth.json`, lembretes de OAuth)

    Observação sobre exec:

    - Por padrão, a auditoria ignora verificações de resolubilidade de SecretRef do tipo exec para evitar efeitos colaterais de comando.
    - Use `openclaw secrets audit --allow-exec` para executar provedores exec durante a auditoria.

    Observação sobre resíduos de cabeçalho:

    - A detecção de cabeçalhos sensíveis de provedor é baseada em heurística de nome (nomes e fragmentos comuns de cabeçalhos de auth/credencial, como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interativo que:

    - configura primeiro `secrets.providers` (`env`/`file`/`exec`, adicionar/editar/remover)
    - permite selecionar campos compatíveis que carregam segredos em `openclaw.json` mais `auth-profiles.json` para um escopo de agente
    - pode criar um novo mapeamento `auth-profiles.json` diretamente no seletor de destino
    - captura detalhes de SecretRef (`source`, `provider`, `id`)
    - executa resolução de preflight
    - pode aplicar imediatamente

    Observação sobre exec:

    - O preflight ignora verificações de SecretRef do tipo exec, a menos que `--allow-exec` esteja definido.
    - Se você aplicar diretamente de `configure --apply` e o plano incluir refs/provedores exec, mantenha `--allow-exec` também definido para a etapa de aplicação.

    Modos úteis:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Padrões de aplicação de `configure`:

    - limpa credenciais estáticas correspondentes de `auth-profiles.json` para provedores selecionados
    - limpa entradas estáticas legadas `api_key` de `auth.json`
    - limpa linhas de segredo conhecidas correspondentes de `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Aplique um plano salvo:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Observação sobre exec:

    - `dry-run` ignora verificações de exec, a menos que `--allow-exec` esteja definido.
    - O modo de gravação rejeita planos que contêm SecretRefs/provedores exec, a menos que `--allow-exec` esteja definido.

    Para detalhes do contrato estrito de destino/caminho e regras exatas de rejeição, consulte [Contrato do plano Secrets Apply](/pt-BR/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Política de segurança unidirecional

<Warning>
O OpenClaw intencionalmente não grava backups de rollback contendo valores históricos de segredos em texto simples.
</Warning>

Modelo de segurança:

- o preflight deve ter sucesso antes do modo de gravação
- a ativação do runtime é validada antes do commit
- o apply atualiza arquivos usando substituição atômica de arquivo e restauração best-effort em caso de falha

## Observações de compatibilidade de auth legado

Para credenciais estáticas, o runtime não depende mais do armazenamento legado de auth em texto simples.

- A origem das credenciais do runtime é o snapshot resolvido em memória.
- Entradas estáticas legadas `api_key` são limpas quando descobertas.
- O comportamento de compatibilidade relacionado a OAuth permanece separado.

## Observação sobre a Web UI

Algumas unions de SecretInput são mais fáceis de configurar no modo de editor bruto do que no modo de formulário.

## Relacionado

- [Autenticação](/pt-BR/gateway/authentication) — configuração de auth
- [CLI: secrets](/pt-BR/cli/secrets) — comandos da CLI
- [Variáveis de ambiente](/pt-BR/help/environment) — precedência de ambiente
- [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) — superfície de credenciais
- [Contrato do plano Secrets Apply](/pt-BR/gateway/secrets-plan-contract) — detalhes do contrato do plano
- [Segurança](/pt-BR/gateway/security) — postura de segurança
