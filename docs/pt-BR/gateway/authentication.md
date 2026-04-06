---
read_when:
    - Depurando autenticação de modelo ou expiração de OAuth
    - Documentando autenticação ou armazenamento de credenciais
summary: 'Autenticação de modelo: OAuth, chaves de API e setup-token legado da Anthropic'
title: Autenticação
x-i18n:
    generated_at: "2026-04-06T03:07:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f59ede3fcd7e692ad4132287782a850526acf35474b5bfcea29e0e23610636c2
    source_path: gateway/authentication.md
    workflow: 15
---

# Autenticação (Provedores de modelo)

<Note>
Esta página cobre a autenticação de **provedor de modelo** (chaves de API, OAuth e setup-token legado da Anthropic). Para autenticação de **conexão do gateway** (token, senha, trusted-proxy), consulte [Configuration](/pt-BR/gateway/configuration) e [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth).
</Note>

O OpenClaw oferece suporte a OAuth e chaves de API para provedores de modelo. Para
hosts de gateway sempre ativos, chaves de API normalmente são a opção mais previsível.
Fluxos de assinatura/OAuth também têm suporte quando correspondem ao modelo de conta do seu provedor.

Consulte [/concepts/oauth](/pt-BR/concepts/oauth) para o fluxo completo de OAuth e o
layout de armazenamento.
Para autenticação baseada em SecretRef (provedores `env`/`file`/`exec`), consulte [Secrets Management](/pt-BR/gateway/secrets).
Para regras de elegibilidade de credenciais/códigos de motivo usadas por `models status --probe`, consulte
[Auth Credential Semantics](/pt-BR/auth-credential-semantics).

## Configuração recomendada (chave de API, qualquer provedor)

Se você estiver executando um gateway de longa duração, comece com uma chave de API para o provedor escolhido.
Especificamente para Anthropic, autenticação com chave de API é o caminho seguro. A
autenticação no estilo assinatura da Anthropic dentro do OpenClaw é o caminho legado com setup-token e
deve ser tratada como um caminho de **Extra Usage**, não como um caminho de limites do plano.

1. Crie uma chave de API no console do seu provedor.
2. Coloque-a no **host do gateway** (a máquina que executa `openclaw gateway`).

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

Depois reinicie o daemon (ou reinicie o processo do Gateway) e verifique novamente:

```bash
openclaw models status
openclaw doctor
```

Se você preferir não gerenciar variáveis de ambiente por conta própria, o onboarding pode armazenar
chaves de API para uso do daemon: `openclaw onboard`.

Consulte [Help](/pt-BR/help) para detalhes sobre herança de ambiente (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilidade com token legado

A autenticação com setup-token da Anthropic ainda está disponível no OpenClaw como um
caminho legado/manual. A documentação pública do Claude Code da Anthropic ainda cobre o uso direto
do Claude Code no terminal sob planos Claude, mas a Anthropic informou separadamente aos usuários do
OpenClaw que o caminho de login do Claude no **OpenClaw** conta como uso de harness de terceiros
e exige **Extra Usage** cobrado separadamente da assinatura.

Para o caminho de configuração mais claro, use uma chave de API da Anthropic. Se você precisar manter um
caminho da Anthropic no estilo assinatura no OpenClaw, use o caminho legado com setup-token
com a expectativa de que a Anthropic o trate como **Extra Usage**.

Entrada manual de token (qualquer provedor; grava `auth-profiles.json` + atualiza a configuração):

```bash
openclaw models auth paste-token --provider openrouter
```

Referências de perfil de autenticação também têm suporte para credenciais estáticas:

- credenciais `api_key` podem usar `keyRef: { source, provider, id }`
- credenciais `token` podem usar `tokenRef: { source, provider, id }`
- Perfis em modo OAuth não oferecem suporte a credenciais SecretRef; se `auth.profiles.<id>.mode` estiver definido como `"oauth"`, a entrada `keyRef`/`tokenRef` com suporte de SecretRef para esse perfil será rejeitada.

Verificação amigável para automação (saída `1` quando expirado/ausente, `2` quando está expirando):

```bash
openclaw models status --check
```

Sondagens de autenticação ao vivo:

```bash
openclaw models status --probe
```

Observações:

- Linhas de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
- Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem informará
  `excluded_by_auth_order` para esse perfil em vez de tentar usá-lo.
- Se a autenticação existir, mas o OpenClaw não conseguir resolver um candidato de modelo sondável para
  esse provedor, a sondagem informará `status: no_model`.
- Cooldowns de limite de taxa podem ser específicos de modelo. Um perfil em cooldown para um
  modelo ainda pode ser utilizável para um modelo irmão no mesmo provedor.

Scripts operacionais opcionais (systemd/Termux) estão documentados aqui:
[Scripts de monitoramento de autenticação](/pt-BR/help/scripts#auth-monitoring-scripts)

## Observação sobre Anthropic

O backend `claude-cli` da Anthropic foi removido.

- Use chaves de API da Anthropic para tráfego Anthropic no OpenClaw.
- O setup-token da Anthropic continua sendo um caminho legado/manual e deve ser usado com
  a expectativa de cobrança de Extra Usage que a Anthropic comunicou aos usuários do OpenClaw.
- `openclaw doctor` agora detecta estado antigo removido do Anthropic Claude CLI. Se
  os bytes de credenciais armazenados ainda existirem, o doctor os converte de volta em
  perfis de token/OAuth da Anthropic. Caso contrário, o doctor remove a configuração antiga do Claude CLI
  e orienta você para recuperação por chave de API ou setup-token.

## Verificando o status de autenticação do modelo

```bash
openclaw models status
openclaw doctor
```

## Comportamento de rotação de chaves de API (gateway)

Alguns provedores oferecem suporte para tentar novamente uma solicitação com chaves alternativas quando uma chamada de API
atinge um limite de taxa do provedor.

- Ordem de prioridade:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição única)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Provedores Google também incluem `GOOGLE_API_KEY` como fallback adicional.
- A mesma lista de chaves é deduplicada antes do uso.
- O OpenClaw tenta novamente com a próxima chave apenas para erros de limite de taxa (por exemplo
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` ou
  `workers_ai ... quota limit exceeded`).
- Erros que não são de limite de taxa não são tentados novamente com chaves alternativas.
- Se todas as chaves falharem, o erro final da última tentativa será retornado.

## Controlando qual credencial é usada

### Por sessão (comando de chat)

Use `/model <alias-or-id>@<profileId>` para fixar uma credencial específica do provedor para a sessão atual (exemplos de ids de perfil: `anthropic:default`, `anthropic:work`).

Use `/model` (ou `/model list`) para um seletor compacto; use `/model status` para a visão completa (candidatos + próximo perfil de autenticação, além de detalhes do endpoint do provedor quando configurado).

### Por agente (sobrescrita de CLI)

Defina uma substituição explícita da ordem dos perfis de autenticação para um agente (armazenada em `auth-profiles.json` desse agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Use `--agent <id>` para direcionar a um agente específico; omita-o para usar o agente padrão configurado.
Quando você depurar problemas de ordem, `openclaw models status --probe` mostrará perfis
armazenados omitidos como `excluded_by_auth_order` em vez de ignorá-los silenciosamente.
Quando você depurar problemas de cooldown, lembre-se de que cooldowns de limite de taxa podem estar ligados
a um id de modelo em vez do perfil inteiro do provedor.

## Solução de problemas

### "No credentials found"

Se o perfil Anthropic estiver ausente, configure uma chave de API da Anthropic no
**host do gateway** ou configure o caminho legado com setup-token da Anthropic, e então verifique novamente:

```bash
openclaw models status
```

### Token expirando/expirado

Execute `openclaw models status` para confirmar qual perfil está expirando. Se um perfil de token legado da
Anthropic estiver ausente ou expirado, atualize essa configuração via
setup-token ou migre para uma chave de API da Anthropic.

Se a máquina ainda tiver estado antigo removido do Anthropic Claude CLI de builds
anteriores, execute:

```bash
openclaw doctor --yes
```

O doctor converte `anthropic:claude-cli` de volta para token/OAuth da Anthropic quando os
bytes de credenciais armazenados ainda existem. Caso contrário, ele remove referências antigas de
perfil/configuração/modelo do Claude CLI e deixa a orientação dos próximos passos.
