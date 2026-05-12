---
read_when:
    - Entendendo os resultados de varredura e moderação do ClawHub
    - Relatando uma Skill ou um pacote
    - Recuperação de uma listagem retida, oculta ou bloqueada
summary: Comportamento de confiança, varredura, relatórios e moderação do ClawHub.
x-i18n:
    generated_at: "2026-05-12T04:10:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança + Moderação

ClawHub está aberto à publicação, mas listagens públicas ainda passam por controles de confiança,
verificação, denúncia e moderação. O objetivo é prático: ajudar usuários
a inspecionar o que instalam, dar aos publicadores um caminho de recuperação para falsos positivos
e manter pacotes abusivos fora da descoberta pública.

Veja também [Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## O que os usuários podem inspecionar

Antes de instalar uma skill ou plugin, verifique a listagem dela no ClawHub para:

- atribuição de proprietário e origem
- versão mais recente e changelog
- variáveis de ambiente ou permissões necessárias
- metadados de compatibilidade para plugins
- status de verificação ou moderação
- denúncias, comentários, estrelas, downloads e sinais de instalação onde exibidos

Instale somente conteúdo que você entenda e em que confie.

## Estados de verificação

ClawHub pode mostrar resultados de verificação ou moderação em páginas públicas e diagnósticos
visíveis ao proprietário.

Resultados comuns incluem:

- `clean`: nenhum problema bloqueante foi encontrado.
- `suspicious`: a versão exige cautela ou revisão.
- `malicious`: a versão é considerada insegura.
- `pending`: as verificações ainda não foram concluídas.
- `held`, `quarantined`, `revoked` ou `hidden`: a versão não está totalmente
  disponível em superfícies públicas de instalação.

A redação exata pode variar conforme a superfície, mas o significado prático é o mesmo: se uma
versão estiver retida ou bloqueada, os usuários não devem instalá-la até que o proprietário resolva
o problema ou a moderação a restaure.

## Skills

Verificações de Skills analisam o pacote de skill publicado, metadados, requisitos
declarados e instruções suspeitas.

ClawHub dá atenção especial a divergências entre o que uma skill declara e
o que ela parece fazer. Por exemplo, uma skill que referencia uma chave de API necessária
deve declarar esse requisito em `SKILL.md` para que os usuários possam vê-lo antes de
instalar.

Achados de verificação são baseados em artefatos. Comportamentos esperados de provedores, como
credenciais de API declaradas, callbacks OAuth em localhost, limpeza de desinstalação com escopo,
codificação de Basic Auth ou uploads de arquivos selecionados pelo usuário para o provedor indicado,
são tratados de forma diferente de encaminhamento oculto de credenciais, acesso amplo a arquivos privados,
destinos de rede não relacionados ou abuso furtivo do navegador.

Veja [Formato de Skill](/pt-BR/clawhub/skill-format).

## Plugins

Versões de Plugin incluem metadados do pacote, atribuição de origem, campos de compatibilidade
e informações de integridade do artefato.

OpenClaw verifica a compatibilidade antes de instalar plugins hospedados no ClawHub. Registros de pacote
também podem expor metadados de digest para que o OpenClaw possa verificar artefatos
baixados. ClawScan inclui metadados de env/config do pacote declarado `openclaw.environment`
ao revisar versões de Plugin, para que requisitos declarados de tempo de execução sejam
comparados ao comportamento observado.

## Denúncias

Usuários conectados podem denunciar skills, pacotes e comentários.

As denúncias devem ser específicas e acionáveis. O abuso de denúncias pode, por si só, levar a
ações contra a conta.

Exemplos de denúncia:

- metadados enganosos
- requisitos de credenciais ou permissões não declarados
- instruções de instalação suspeitas
- comentários fraudulentos ou falsificação de identidade
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola [Uso aceitável](/pt-BR/clawhub/acceptable-usage)

## Notas do ClawScan para publicadores

Publicadores podem fornecer uma nota opcional do ClawScan ao publicar uma skill ou
plugin. Essa nota dá contexto ao ClawScan sobre comportamentos que, de outra forma, poderiam parecer
incomuns, como acesso à rede, acesso a host nativo ou credenciais específicas de provedor.

## Retenções de moderação

Quando o verificador estático sinaliza uma skill enviada como maliciosa, o publicador é
automaticamente colocado sob uma retenção de moderação (`requiresModerationAt` definido no
usuário). Isso oculta todas as skills do publicador, faz com que futuras publicações
comecem ocultas e cria uma entrada de log de auditoria `user.moderation.auto`.

Achados estáticos suspeitos são mantidos como evidência de arquivo/linha para moderadores,
mas eles não ocultam conteúdo nem decidem sozinhos o veredito público da verificação.
Novos envios permanecem em estado de revisão/pendente até que a revisão por LLM seja concluída. A verificação
estática bloqueia imediatamente apenas assinaturas maliciosas. Detecções de motores do
VirusTotal permanecem como evidência de segurança visível, mas vereditos do VirusTotal Code Insight/Palm
são consultivos e não ocultam skills por conta própria. Revisões por LLM do ClawScan
mantêm notas alinhadas ao propósito como orientação. Achados de revisão médios permanecem visíveis no
artefato, enquanto o filtro de suspeita é reservado para preocupações de LLM de alto impacto,
achados maliciosos ou detecções corroboradas de motores AV.

Administradores podem remover uma retenção por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Isso limpa `requiresModerationAt` e `requiresModerationReason`, restaura
skills ocultas pela retenção em nível de usuário e grava uma entrada de log de auditoria
`user.moderation.lift`. Skills ocultas por outros motivos, ou cuja própria verificação estática permaneça
maliciosa, continuam ocultas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso à publicação. Abusos graves
podem resultar em banimentos de conta, revogação de tokens, conteúdo oculto ou listagens
removidas.

Contas excluídas, banidas ou desativadas não podem usar tokens da API do ClawHub. Se a autenticação da CLI
começar a falhar após uma ação na conta, entre na interface web para revisar o
estado da conta. Se o login ou o acesso normal pela CLI estiver bloqueado, entre em contato com
security@openclaw.ai para revisão de recuperação.

## Orientação para publicadores

Para reduzir falsos positivos e melhorar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões necessárias
- adicione uma nota do ClawScan do publicador quando uma versão tiver comportamento incomum, mas intencional
- evite comandos de instalação ofuscados
- crie links para a origem quando possível
- use dry runs antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento do pacote
