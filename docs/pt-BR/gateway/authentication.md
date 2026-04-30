---
read_when:
    - Depuração da autenticação de modelo ou da expiração do OAuth
    - Documentando autenticação ou armazenamento de credenciais
summary: 'Autenticação de modelos: OAuth, chaves de API, reutilização da CLI do Claude e setup-token da Anthropic'
title: Autenticação
x-i18n:
    generated_at: "2026-04-30T09:46:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Esta página é a referência de autenticação do **provedor de modelo** (chaves de API, OAuth, reutilização da Claude CLI e setup-token da Anthropic). Para autenticação de **conexão do Gateway** (token, senha, trusted-proxy), consulte [Configuração](/pt-BR/gateway/configuration) e [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
</Note>

O OpenClaw oferece suporte a OAuth e chaves de API para provedores de modelo. Para hosts de Gateway
sempre ativos, as chaves de API geralmente são a opção mais previsível. Fluxos de assinatura/OAuth
também têm suporte quando correspondem ao modelo de conta do seu provedor.

Consulte [/concepts/oauth](/pt-BR/concepts/oauth) para ver o fluxo OAuth completo e o layout
de armazenamento.
Para autenticação baseada em SecretRef (provedores `env`/`file`/`exec`), consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).
Para regras de elegibilidade de credenciais/códigos de motivo usadas por `models status --probe`, consulte
[Semântica de credenciais de autenticação](/pt-BR/auth-credential-semantics).

## Configuração recomendada (chave de API, qualquer provedor)

Se você estiver executando um Gateway de longa duração, comece com uma chave de API para o
provedor escolhido.
Especificamente para a Anthropic, a autenticação por chave de API ainda é a configuração de servidor
mais previsível, mas o OpenClaw também oferece suporte à reutilização de um login local da Claude CLI.

1. Crie uma chave de API no console do seu provedor.
2. Coloque-a no **host do Gateway** (a máquina que executa `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se o Gateway for executado sob systemd/launchd, prefira colocar a chave em
   `~/.openclaw/.env` para que o daemon possa lê-la:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Em seguida, reinicie o daemon (ou reinicie seu processo do Gateway) e verifique novamente:

```bash
openclaw models status
openclaw doctor
```

Se você preferir não gerenciar variáveis de ambiente manualmente, o onboarding pode armazenar
chaves de API para uso pelo daemon: `openclaw onboard`.

Consulte [Ajuda](/pt-BR/help) para detalhes sobre herança de ambiente (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilidade com Claude CLI e token

A autenticação por setup-token da Anthropic ainda está disponível no OpenClaw como um caminho de token
compatível. A equipe da Anthropic nos informou posteriormente que o uso da Claude CLI no estilo do OpenClaw
é permitido novamente, então o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como
autorizados para esta integração, a menos que a Anthropic publique uma nova política. Quando
a reutilização da Claude CLI estiver disponível no host, esse agora é o caminho preferencial.

Para hosts de Gateway de longa duração, uma chave de API da Anthropic ainda é a configuração
mais previsível. Se você quiser reutilizar um login existente da Claude no mesmo host, use o
caminho da Anthropic Claude CLI em onboarding/configure.

Configuração recomendada do host para reutilização da Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Esta é uma configuração em duas etapas:

1. Faça login do próprio Claude Code na Anthropic no host do Gateway.
2. Informe ao OpenClaw para alternar a seleção de modelos da Anthropic para o backend local `claude-cli`
   e armazenar o perfil de autenticação correspondente do OpenClaw.

Se `claude` não estiver no `PATH`, instale o Claude Code primeiro ou defina
`agents.defaults.cliBackends.claude-cli.command` como o caminho real do binário.

Entrada manual de token (qualquer provedor; grava `auth-profiles.json` + atualiza a configuração):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` armazena apenas credenciais. A forma canônica é:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

O OpenClaw espera a forma canônica `version` + `profiles` em tempo de execução. Se uma instalação mais antiga ainda tiver um arquivo simples como `{ "openrouter": { "apiKey": "..." } }`, execute `openclaw doctor --fix` para regravá-lo como um perfil de chave de API `openrouter:default`; o doctor mantém uma cópia `.legacy-flat.*.bak` ao lado do original. Detalhes de endpoint como `baseUrl`, `api`, ids de modelo, cabeçalhos e timeouts pertencem a `models.providers.<id>` em `openclaw.json` ou `models.json`, não em `auth-profiles.json`.

Refs de perfil de autenticação também têm suporte para credenciais estáticas:

- Credenciais `api_key` podem usar `keyRef: { source, provider, id }`
- Credenciais `token` podem usar `tokenRef: { source, provider, id }`
- Perfis em modo OAuth não oferecem suporte a credenciais SecretRef; se `auth.profiles.<id>.mode` estiver definido como `"oauth"`, a entrada `keyRef`/`tokenRef` baseada em SecretRef para esse perfil será rejeitada.

Verificação amigável para automação (saída `1` quando expirado/ausente, `2` quando prestes a expirar):

```bash
openclaw models status --check
```

Sondagens de autenticação ao vivo:

```bash
openclaw models status --probe
```

Observações:

- Linhas de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
- Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem relata
  `excluded_by_auth_order` para esse perfil em vez de tentá-lo.
- Se existir autenticação, mas o OpenClaw não conseguir resolver um candidato de modelo sondável para
  esse provedor, a sondagem relata `status: no_model`.
- Cooldowns de limite de taxa podem ter escopo de modelo. Um perfil em cooldown para um
  modelo ainda pode ser utilizável para um modelo irmão no mesmo provedor.

Scripts operacionais opcionais (systemd/Termux) estão documentados aqui:
[Scripts de monitoramento de autenticação](/pt-BR/help/scripts#auth-monitoring-scripts)

## Observação sobre a Anthropic

O backend `claude-cli` da Anthropic tem suporte novamente.

- A equipe da Anthropic nos informou que este caminho de integração do OpenClaw é permitido novamente.
- Portanto, o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como autorizados
  para execuções com suporte da Anthropic, a menos que a Anthropic publique uma nova política.
- As chaves de API da Anthropic continuam sendo a opção mais previsível para hosts de Gateway
  de longa duração e controle explícito de cobrança no lado do servidor.

## Verificar o status de autenticação de modelos

```bash
openclaw models status
openclaw doctor
```

## Comportamento de rotação de chaves de API (Gateway)

Alguns provedores oferecem suporte a tentar novamente uma solicitação com chaves alternativas quando uma chamada de API
atinge um limite de taxa do provedor.

- Ordem de prioridade:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição única)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Provedores Google também incluem `GOOGLE_API_KEY` como fallback adicional.
- A mesma lista de chaves tem duplicatas removidas antes do uso.
- O OpenClaw tenta novamente com a próxima chave apenas para erros de limite de taxa (por exemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` ou
  `workers_ai ... quota limit exceeded`).
- Erros que não são de limite de taxa não são repetidos com chaves alternativas.
- Se todas as chaves falharem, o erro final da última tentativa será retornado.

## Controlar qual credencial é usada

### Por sessão (comando de chat)

Use `/model <alias-or-id>@<profileId>` para fixar uma credencial específica do provedor na sessão atual (exemplos de ids de perfil: `anthropic:default`, `anthropic:work`).

Use `/model` (ou `/model list`) para um seletor compacto; use `/model status` para a visualização completa (candidatos + próximo perfil de autenticação, além de detalhes do endpoint do provedor quando configurado).

### Por agente (substituição da CLI)

Defina uma substituição explícita da ordem de perfis de autenticação para um agente (armazenada no `auth-state.json` desse agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Use `--agent <id>` para mirar em um agente específico; omita para usar o agente padrão configurado.
Ao depurar problemas de ordem, `openclaw models status --probe` mostra perfis armazenados omitidos
como `excluded_by_auth_order` em vez de ignorá-los silenciosamente.
Ao depurar problemas de cooldown, lembre-se de que cooldowns de limite de taxa podem estar vinculados
a um id de modelo em vez do perfil inteiro do provedor.

## Solução de problemas

### "Nenhuma credencial encontrada"

Se o perfil da Anthropic estiver ausente, configure uma chave de API da Anthropic no
**host do Gateway** ou configure o caminho de setup-token da Anthropic e verifique novamente:

```bash
openclaw models status
```

### Token prestes a expirar/expirado

Execute `openclaw models status` para confirmar qual perfil está expirando. Se um
perfil de token da Anthropic estiver ausente ou expirado, atualize essa configuração via
setup-token ou migre para uma chave de API da Anthropic.

## Relacionados

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Armazenamento de autenticação](/pt-BR/concepts/oauth)
