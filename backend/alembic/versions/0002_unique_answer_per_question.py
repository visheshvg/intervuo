"""unique answer per session question

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_interview_answers_session_question",
        "interview_answers",
        ["session_id", "question_index"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_interview_answers_session_question",
        "interview_answers",
        type_="unique",
    )
