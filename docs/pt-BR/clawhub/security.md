---
read_when:
    - Entendendo os resultados de verificação e moderação do ClawHub
    - Relatar uma Skill ou pacote
    - Recuperação de uma listagem retida, oculta ou bloqueada
summary: Comportamento de confiança, varredura, relatórios e moderação do ClawHub.
x-i18n:
    generated_at: "2026-05-13T02:51:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança + Moderação

O ClawHub é aberto a publicações, mas listagens públicas ainda passam por controles de confiança,
varredura, denúncia e moderação. O objetivo é prático: ajudar usuários
a inspecionar o que instalam, dar aos publicadores um caminho de recuperação para falsos positivos
e manter pacotes abusivos fora da descoberta pública.

Veja também [Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## O que os usuários podem inspecionar

Antes de instalar uma skill ou plugin, verifique a listagem no ClawHub para:

- proprietário e atribuição da fonte
- versão mais recente e changelog
- variáveis de ambiente ou permissões exigidas
- metadados de compatibilidade para plugins
- status de varredura ou moderação
- denúncias, comentários, estrelas, downloads e sinais de instalação quando exibidos

Instale apenas conteúdo que você entende e em que confia.

## Estados de varredura

O ClawHub pode mostrar resultados de varredura ou moderação em páginas públicas e diagnósticos
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

As varreduras de Skills analisam o pacote de skill publicado, metadados, requisitos
declarados e instruções suspeitas.

O ClawHub presta atenção especial a incompatibilidades entre o que uma skill declara e
o que ela parece fazer. Por exemplo, uma skill que referencia uma chave de API obrigatória
deve declarar esse requisito em `SKILL.md` para que os usuários possam vê-lo antes
de instalar.

Os achados de varredura são baseados em artefatos. Comportamentos esperados de provedores, como
credenciais de API declaradas, callbacks OAuth de localhost, limpeza de desinstalação com escopo,
codificação de Basic Auth ou uploads de arquivos selecionados pelo usuário para o provedor declarado, são tratados
de forma diferente de encaminhamento oculto de credenciais, amplo acesso a arquivos privados,
destinos de rede não relacionados ou abuso furtivo de navegador.

Veja [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Versões de Plugin incluem metadados de pacote, atribuição de fonte, campos de compatibilidade
e informações de integridade de artefato.

O OpenClaw verifica a compatibilidade antes de instalar plugins hospedados no ClawHub. Registros de pacote
também podem expor metadados de digest para que o OpenClaw possa verificar artefatos
baixados. O ClawScan inclui metadados declarados de env/config de pacote `openclaw.environment`
ao revisar versões de plugin, para que os requisitos de runtime declarados sejam
comparados ao comportamento observado.

## Denúncias

Usuários conectados podem denunciar Skills, pacotes e comentários.

As denúncias devem ser específicas e acionáveis. O abuso de denúncias pode, por si só, levar a
medidas contra a conta.

Exemplos de denúncia:

- metadados enganosos
- requisitos de credencial ou permissão não declarados
- instruções de instalação suspeitas
- comentários fraudulentos ou falsificação de identidade
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola [Uso aceitável](/pt-BR/clawhub/acceptable-usage)

## Observações do ClawScan para publicadores

Publicadores podem fornecer uma observação opcional do ClawScan ao publicar uma skill ou
plugin. Essa observação dá contexto ao ClawScan para comportamentos que, de outra forma, poderiam parecer
incomuns, como acesso à rede, acesso a host nativo ou credenciais específicas de provedor.

## Retenções de moderação

Quando o scanner estático sinaliza uma skill enviada como maliciosa, o publicador é
automaticamente colocado sob uma retenção de moderação (`requiresModerationAt` definido no
usuário). Isso oculta todas as Skills do publicador, faz publicações futuras
começarem ocultas e cria uma entrada de log de auditoria `user.moderation.auto`.

Achados estáticos suspeitos são retidos como evidência de arquivo/linha para moderadores,
mas não ocultam conteúdo nem decidem o veredito público de varredura por conta própria.
Novos envios permanecem em estado de revisão/pendente até que a revisão por LLM seja concluída. A varredura estática
só bloqueia imediatamente em caso de assinaturas maliciosas. Acertos de mecanismos do VirusTotal
permanecem como evidência de segurança visível, mas vereditos do VirusTotal Code Insight/Palm
são consultivos e não ocultam Skills por conta própria. Revisões por LLM do ClawScan
mantêm observações alinhadas ao propósito como orientação. Achados médios de revisão permanecem visíveis no
artefato, enquanto o filtro suspeito é reservado para preocupações de LLM de alto impacto,
achados maliciosos ou detecções corroboradas por mecanismos de AV.

Administradores podem suspender uma retenção por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Isso limpa `requiresModerationAt` e `requiresModerationReason`, restaura
Skills ocultas pela retenção no nível do usuário e grava uma entrada de log de auditoria
`user.moderation.lift`. Skills ocultas por outros motivos, ou cuja própria varredura estática permaneça
maliciosa, continuam ocultas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso de publicação. Abusos graves
podem resultar em banimentos de conta, revogação de tokens, conteúdo oculto ou listagens
removidas.

Contas excluídas, banidas ou desabilitadas não podem usar tokens da API do ClawHub. Se a autenticação da CLI
começar a falhar após uma ação na conta, entre na interface web para revisar o estado da conta.
Se o login ou o acesso normal pela CLI estiver bloqueado, entre em contato com
security@openclaw.ai para revisão de recuperação.

## Orientação para publicadores

Para reduzir falsos positivos e melhorar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões exigidas
- adicione uma observação do ClawScan para publicador quando uma versão tiver comportamento incomum, mas intencional
- evite comandos de instalação ofuscados
- crie links para o código-fonte quando possível
- use dry runs antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento do pacote
