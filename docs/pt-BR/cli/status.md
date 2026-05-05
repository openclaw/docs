---
read_when:
    - Você quer um diagnóstico rápido da integridade do canal + destinatários recentes da sessão
    - Você quer um status “all” que possa ser colado para depuração
summary: Referência da CLI para `openclaw status` (diagnósticos, sondagens, instantâneos de uso)
title: Status
x-i18n:
    generated_at: "2026-05-05T06:15:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnósticos para canais + sessões.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Observações:

- `--deep` executa verificações ao vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` simples permanece no caminho rápido somente leitura e marca a memória como `not checked` em vez de indisponível quando pula a inspeção de memória. Auditoria de segurança pesada, compatibilidade de Plugin e verificações de vetor de memória ficam para `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` e `openclaw memory status --deep`.
- `status --json --all` relata detalhes de memória do runtime do Plugin de memória ativo selecionado por `plugins.slots.memory`. Plugins de memória personalizados podem deixar `agents.defaults.memorySearch.enabled` integrado desativado e ainda relatar seus próprios arquivos, fragmentos, vetor e estado de FTS.
- `--usage` imprime janelas normalizadas de uso do provedor como `X% left`.
- A saída de status da sessão separa `Execution:` de `Runtime:`. `Execution` é o caminho do sandbox (`direct`, `docker/*`), enquanto `Runtime` informa se a sessão está usando `OpenClaw Pi Default`, `OpenAI Codex`, um backend de CLI ou um backend de ACP, como `codex (acp/acpx)`. Consulte [Runtimes de agentes](/pt-BR/concepts/agent-runtimes) para a distinção entre provedor/modelo/runtime.
- Os campos brutos `usage_percent` / `usagePercent` da MiniMax são a cota restante, então o OpenClaw os inverte antes da exibição; campos baseados em contagem prevalecem quando presentes. Respostas de `model_remains` preferem a entrada do modelo de chat, derivam o rótulo da janela de carimbos de data/hora quando necessário e incluem o nome do modelo no rótulo do plano.
- Quando o snapshot da sessão atual é esparso, `/status` pode preencher retroativamente os contadores de tokens e cache a partir do log de uso da transcrição mais recente. Valores ao vivo existentes e diferentes de zero ainda prevalecem sobre valores de fallback da transcrição.
- `/status` inclui tempo de atividade compacto do processo do Gateway e tempo de atividade do sistema host.
- O fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo quando a entrada da sessão ao vivo não o contém. Se esse modelo da transcrição for diferente do modelo selecionado, o status resolve a janela de contexto usando o modelo de runtime recuperado em vez do selecionado.
- Para contabilização de tamanho do prompt, o fallback da transcrição prefere o maior total orientado a prompt quando os metadados da sessão estão ausentes ou são menores, para que sessões de provedores personalizados não sejam reduzidas a exibições de `0` token.
- A saída inclui armazenamentos de sessão por agente quando vários agentes estão configurados.
- A visão geral inclui o status de instalação/runtime do serviço do Gateway + host do Node quando disponível.
- A visão geral inclui o canal de atualização + SHA do git (para checkouts de código-fonte).
- Informações de atualização aparecem na Visão geral; se houver uma atualização disponível, o status imprime uma dica para executar `openclaw update` (consulte [Atualização](/pt-BR/install/updating)).
- Superfícies de status somente leitura (`status`, `status --json`, `status --all`) resolvem SecretRefs compatíveis para seus caminhos de configuração direcionados quando possível.
- Se uma SecretRef de canal compatível estiver configurada, mas indisponível no caminho do comando atual, o status permanece somente leitura e relata saída degradada em vez de falhar. A saída humana mostra avisos como “token configurado indisponível neste caminho de comando”, e a saída JSON inclui `secretDiagnostics`.
- Quando a resolução de SecretRef local ao comando é bem-sucedida, o status prefere o snapshot resolvido e limpa marcadores transitórios de “segredo indisponível” do canal na saída final.
- `status --all` inclui uma linha de visão geral de Segredos e uma seção de diagnóstico que resume diagnósticos de segredo (truncados para legibilidade) sem interromper a geração do relatório.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/gateway/doctor)
