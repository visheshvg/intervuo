"""answer feedback fields

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("interview_answers", sa.Column("model_answer", sa.Text(), nullable=True))
    op.add_column("interview_answers", sa.Column("word_count", sa.Integer(), nullable=True))
    op.add_column("interview_answers", sa.Column("filler_count", sa.Integer(), nullable=True))
    op.add_column("interview_answers", sa.Column("speaking_wpm", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("interview_answers", "speaking_wpm")
    op.drop_column("interview_answers", "filler_count")
    op.drop_column("interview_answers", "word_count")
    op.drop_column("interview_answers", "model_answer")
