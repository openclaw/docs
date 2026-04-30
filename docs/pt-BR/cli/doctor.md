---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação rápida
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-04-30T09:40:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Verificações de integridade + correções rápidas para o Gateway e canais.

Relacionado:

- Solução de problemas: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Auditoria de segurança: [Segurança](/pt-BR/gateway/security)

## Exemplos

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opções

- `--no-workspace-suggestions`: desativa sugestões de memória/pesquisa da área de trabalho
- `--yes`: aceita os padrões sem solicitar confirmação
- `--repair`: aplica reparos recomendados sem solicitar confirmação
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever a configuração de serviço personalizada quando necessário
- `--non-interactive`: executa sem prompts; somente migrações seguras
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway

Observações:

- Prompts interativos (como correções de chaveiro/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções sem interface (cron, Telegram, sem terminal) pularão prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento antecipado de plugins para que verificações de integridade sem interface permaneçam rápidas. Sessões interativas ainda carregam plugins por completo quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige confirmação interativa; `--fix`, `--yes` e execuções sem interface os deixam no lugar.
- O Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de jobs cron e pode regravá-los no lugar antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- O Doctor repara dependências ausentes de runtime de plugins incluídos sem gravar em instalações globais empacotadas. Para instalações npm pertencentes ao root ou unidades systemd reforçadas, defina `OPENCLAW_PLUGIN_STAGE_DIR` para um diretório gravável, como `/var/lib/openclaw/plugin-runtime-deps`; ele também pode ser uma lista de caminhos, como `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, em que raízes anteriores são camadas de consulta somente leitura e a raiz final é o alvo do reparo.
- O Doctor repara configurações obsoletas de plugins removendo IDs de plugins ausentes de `plugins.allow`/`plugins.entries`, além de configurações de canal pendentes correspondentes, alvos de Heartbeat e substituições de modelo de canal quando a descoberta de plugins está íntegra.
- O Doctor coloca em quarentena configurações inválidas de plugins desativando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já pula apenas esse plugin problemático para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor controla o ciclo de vida do Gateway. O Doctor ainda relata a integridade do Gateway/serviço e aplica reparos que não envolvem serviço, mas pula instalação/início/reinício/bootstrap de serviço e limpeza de serviço legado.
- No Linux, o doctor ignora unidades systemd extras inativas semelhantes ao Gateway e não regrava metadados de comando/ponto de entrada para um serviço systemd do Gateway em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando quiser substituir intencionalmente o inicializador ativo.
- O Doctor migra automaticamente a configuração plana legada do Talk (`talk.voiceId`, `talk.modelId` e afins) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embeddings estão ausentes.
- O Doctor avisa quando nenhum proprietário de comandos está configurado. O proprietário de comandos é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém fale com o bot; se você aprovou um remetente antes de existir o bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- Se o modo sandbox estiver ativado, mas o Docker estiver indisponível, o doctor relata um aviso de alto sinal com correção (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho do comando atual, o doctor relata um aviso somente leitura e não grava credenciais alternativas em texto simples.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, o doctor continua e relata um aviso em vez de sair antecipadamente.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho do comando atual. Se a inspeção do token estiver indisponível, o doctor relata um aviso e pula a resolução automática nessa passagem.

## macOS: substituições de env do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de “não autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
