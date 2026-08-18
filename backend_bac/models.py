from datetime import datetime, timezone
import json
from bson import ObjectId
from mongodb_config import db

class IntegrationSettings:
    def __init__(self, user_id, shopify_config='{}', quickbooks_config='{}', stripe_config='{}', mailchimp_config='{}'):
        self.user_id = user_id
        self.shopify_config = shopify_config
        self.quickbooks_config = quickbooks_config
        self.stripe_config = stripe_config
        self.mailchimp_config = mailchimp_config
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def get_by_user_id(user_id):
        result = db.integration_settings.find_one({'user_id': user_id})
        if result:
            return IntegrationSettings(
                user_id=result['user_id'],
                shopify_config=result['shopify_config'],
                quickbooks_config=result['quickbooks_config'],
                stripe_config=result['stripe_config'],
                mailchimp_config=result['mailchimp_config']
            )
        return None

    def save(self):
        try:
            db.integration_settings.update_one(
                {'user_id': self.user_id},
                {
                    '$set': {
                        'shopify_config': self.shopify_config,
                        'quickbooks_config': self.quickbooks_config,
                        'stripe_config': self.stripe_config,
                        'mailchimp_config': self.mailchimp_config,
                        'updated_at': datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
        except Exception as e:
            raise e

    def to_dict(self):
        return {
            'shopify': json.loads(self.shopify_config),
            'quickbooks': json.loads(self.quickbooks_config),
            'stripe': json.loads(self.stripe_config),
            'mailchimp': json.loads(self.mailchimp_config)
        }

class NotificationSettings:
    def __init__(self, user_id, settings):
        self.user_id = user_id
        self.settings = settings
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    @staticmethod
    def get_by_user_id(user_id):
        result = db.notification_settings.find_one({'user_id': user_id})
        if result:
            return NotificationSettings(
                user_id=result['user_id'],
                settings=result['settings']
            )
        return None

    def save(self):
        try:
            db.notification_settings.update_one(
                {'user_id': self.user_id},
                {
                    '$set': {
                        'settings': self.settings,
                        'updated_at': datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
        except Exception as e:
            raise e

    def to_dict(self):
        return {
            'id': self.user_id,
            'settings': self.settings,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 