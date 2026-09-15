"""sync missing tables and columns

Revision ID: 20260913_0001
Revises: 
Create Date: 2026-09-13 17:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260913_0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # If running on a fresh empty database, create all tables defined in Base models
    if "telemetry_data" not in existing_tables:
        from app.models import Base
        Base.metadata.create_all(bind)
        return

    # 1. Add missing columns to telemetry_data (safe additive changes with server_default)
    op.add_column(
        'telemetry_data',
        sa.Column('data_source', sa.String(length=30), nullable=False, server_default='MANUAL')
    )
    op.add_column(
        'telemetry_data',
        sa.Column('insar_displacement_mm', sa.Float(), nullable=False, server_default='0.0')
    )
    op.create_index(
        op.f('ix_telemetry_data_data_source'),
        'telemetry_data',
        ['data_source'],
        unique=False
    )

    # 2. Create missing table: insar_displacement_data
    op.create_table(
        'insar_displacement_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('station_id', sa.Integer(), nullable=False),
        sa.Column('acquisition_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('displacement_mm_yr', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('coherence_score', sa.Float(), nullable=False, server_default='0.85'),
        sa.Column('satellite_name', sa.String(length=30), nullable=False, server_default='SENTINEL_1A'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['station_id'], ['sensor_stations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_insar_displacement_data_id'), 'insar_displacement_data', ['id'], unique=False)
    op.create_index(op.f('ix_insar_displacement_data_station_id'), 'insar_displacement_data', ['station_id'], unique=False)
    op.create_index(op.f('ix_insar_displacement_data_acquisition_date'), 'insar_displacement_data', ['acquisition_date'], unique=False)

    # 3. Create missing table: data_ingestion_logs
    op.create_table(
        'data_ingestion_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source_name', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='RUNNING'),
        sa.Column('records_fetched', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_inserted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_skipped', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('triggered_by', sa.String(length=30), nullable=False, server_default='SCHEDULER'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_data_ingestion_logs_id'), 'data_ingestion_logs', ['id'], unique=False)
    op.create_index(op.f('ix_data_ingestion_logs_source_name'), 'data_ingestion_logs', ['source_name'], unique=False)

    # 4. Create missing table: users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('role', sa.String(length=30), nullable=False, server_default='CONTROL_ROOM_OPERATOR'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('state_jurisdiction', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_data_ingestion_logs_source_name'), table_name='data_ingestion_logs')
    op.drop_index(op.f('ix_data_ingestion_logs_id'), table_name='data_ingestion_logs')
    op.drop_table('data_ingestion_logs')

    op.drop_index(op.f('ix_insar_displacement_data_acquisition_date'), table_name='insar_displacement_data')
    op.drop_index(op.f('ix_insar_displacement_data_station_id'), table_name='insar_displacement_data')
    op.drop_index(op.f('ix_insar_displacement_data_id'), table_name='insar_displacement_data')
    op.drop_table('insar_displacement_data')

    op.drop_index(op.f('ix_telemetry_data_data_source'), table_name='telemetry_data')
    op.drop_column('telemetry_data', 'insar_displacement_mm')
    op.drop_column('telemetry_data', 'data_source')
