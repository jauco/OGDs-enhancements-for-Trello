An extension that counts points on trello cards.

We use it at OGD to make trello work just a bit better as a Scrum board.

 * shows points typed between parens. (e.g. "improve the world (2)")
 * It dims cards that have no points assigned (So everyone's aware that those tasks aren't accounted for in the totals)
 * You can use '?' to indicate that the count is not known yet
 * If a list has a '?' card it's point total will end in '?' as well
 * large numbers are presented in red

 * Presents card that have a title surrounded by three stars like: "***card title***" as "separator" cards. Use labels to color them.
 * Shows the board description using a button that is more discoverable than the trello default
 * Allows you to put (B) (I) (D) next to a list title (for indicating (B)acklog, (I)n work and (D)one. It shows lists that are backlog or done using a darker color

Note:
 * Doesn't have the point picker in the trello card
 * Started out as some adaptations of [Scrum for Trello](https://github.com/Q42/TrelloScrum) but is mostly different code now.