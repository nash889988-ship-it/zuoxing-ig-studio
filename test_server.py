import unittest, os
import server

class WebsiteTests(unittest.TestCase):
    def test_news_structure_without_live_dependency(self):
        self.assertEqual(len(server.TOPIC_QUERIES),3)
        self.assertTrue(all(cat and query for cat,query in server.TOPIC_QUERIES))
    def test_ai_requires_secret(self):
        old=os.environ.pop('OPENAI_API_KEY',None)
        try:
            with self.assertRaisesRegex(ValueError,'OPENAI_API_KEY'):
                server.chat_ai({'topic':'親子露營','count':7})
            with self.assertRaisesRegex(ValueError,'OPENAI_API_KEY'):
                server.generate_image({'prompt':'山景'})
        finally:
            if old:os.environ['OPENAI_API_KEY']=old
    def test_allowed_body_limit(self):
        self.assertLessEqual(server.MAX_BODY,3_000_000)
    def test_localhost_only(self):
        self.assertEqual(server.HOST,'127.0.0.1')

if __name__=='__main__':unittest.main()
